import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { SiteConfig, House } from '~/types'
import { DEFAULT_SITE_CONFIG, OCCUPIED_STATUSES } from '~/types'

interface MonthTrend {
  period: string
  pemasukan: number
  pengeluaran: number
}

interface LatestTransaction {
  id: string
  period: string
  type: string
  category: string
  description: string
  amount: number
  date: string
}

interface GlobalSummary {
  globalSaldo: number
  totalPemasukan: number
  totalPengeluaran: number
  currentPeriodStats: {
    totalPaid: number
    totalUnpaid: number
    totalOccupied: number
    iuranTerkumpul: number
  }
  trendMonthly: MonthTrend[]
  pengeluaranByCategory: Record<string, number>
  latestTransactions: LatestTransaction[]
}

export default defineEventHandler(async () => {
  return cachedFetch('summary:global', CACHE_TTL.IPL_RECORDS, async () => {
    const db = getFirestoreDb()

    const configData = await cachedFetch<SiteConfig>(CACHE_KEYS.CONFIG, CACHE_TTL.CONFIG, async () => {
      const configSnap = await db.collection('config').doc('site').get()
      return configSnap.exists ? (configSnap.data() as SiteConfig) : DEFAULT_SITE_CONFIG
    })

    // Fetch houses for active filtering
    const houses = await cachedFetch<House[]>(CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
      const snapshot = await db.collection('houses').get()
      const result: House[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        result.push({
          id: doc.id,
          block: data.block,
          house_number: data.house_number,
          pic: data.pic,
          is_active: data.is_active !== false,
          created_at: null,
        })
      })
      return result
    })

    const activeHouseIds = new Set(houses.filter(h => h.is_active !== false).map(h => h.id))

    const iplSnap = await db.collection('ipl_records').get()
    const kasSnap = await db.collection('kas_log').get()

    let globalPemasukan = 0
    let globalPengeluaran = 0

    // Group IPL by period, filtering by active houses
    const iplByPeriod = new Map<string, any[]>()
    iplSnap.forEach(doc => {
      const data = doc.data()
      if (!activeHouseIds.has(data.house_id)) return
      const period = data.period
      if (!iplByPeriod.has(period)) iplByPeriod.set(period, [])
      iplByPeriod.get(period)!.push(data)
    })

    const kasByPeriod = new Map<string, any[]>()
    const allKasEntries: any[] = []
    kasSnap.forEach(doc => {
      const data = doc.data()
      const entry = { id: doc.id, ...data }
      allKasEntries.push(entry)
      const period = data.period
      if (!kasByPeriod.has(period)) kasByPeriod.set(period, [])
      kasByPeriod.get(period)!.push(entry)
    })

    const allPeriods = new Set<string>([...iplByPeriod.keys(), ...kasByPeriod.keys()])
    const monthlyData = new Map<string, { pemasukan: number; pengeluaran: number }>()

    for (const period of allPeriods) {
      const iplRecords = iplByPeriod.get(period) || []
      const kasEntries = kasByPeriod.get(period) || []

      let periodIuran = 0
      iplRecords.forEach((data: any) => {
        if (data.status_iuran === 'Terbayarkan') {
          const usage = Math.max(0, (data.water_meter_current || 0) - (data.water_meter_past || 0))
          let total = 0
          if ((data.jenis_iuran || '').includes('Sampah')) {
            total += configData.dues_trash_flat || 25000
          }
          if ((data.jenis_iuran || '').includes('Air')) {
            const minFee = configData.water_min_fee || 25000
            const pricePerCubic = configData.water_price_per_cubic || 3500
            if (data.status_rumah === 'Kosong' && usage === 0) {
              // no water fee
            } else {
              total += usage <= 10 ? minFee : minFee + (usage - 10) * pricePerCubic
            }
          }
          periodIuran += total
        }
      })

      let periodKasMasuk = 0
      let periodKasKeluar = 0
      kasEntries.forEach((data: any) => {
        if (data.type === 'masuk') {
          periodKasMasuk += data.amount || 0
        } else if (data.type === 'keluar') {
          periodKasKeluar += data.amount || 0
        }
      })

      const periodPemasukan = periodIuran + periodKasMasuk
      globalPemasukan += periodPemasukan
      globalPengeluaran += periodKasKeluar

      monthlyData.set(period, { pemasukan: periodPemasukan, pengeluaran: periodKasKeluar })
    }

    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const currentIpl = iplByPeriod.get(currentPeriod) || []

    let currentPaid = 0
    let currentUnpaid = 0
    let currentIuran = 0
    let currentOccupied = 0

    currentIpl.forEach((data: any) => {
      if (OCCUPIED_STATUSES.includes(data.status_rumah)) {
        currentOccupied++
        if (data.status_iuran === 'Terbayarkan') {
          currentPaid++
          const usage = Math.max(0, (data.water_meter_current || 0) - (data.water_meter_past || 0))
          let total = 0
          if ((data.jenis_iuran || '').includes('Sampah')) {
            total += configData.dues_trash_flat || 25000
          }
          if ((data.jenis_iuran || '').includes('Air')) {
            const minFee = configData.water_min_fee || 25000
            const pricePerCubic = configData.water_price_per_cubic || 3500
            if (data.status_rumah === 'Kosong' && usage === 0) {
              // no water fee
            } else {
              total += usage <= 10 ? minFee : minFee + (usage - 10) * pricePerCubic
            }
          }
          currentIuran += total
        } else {
          currentUnpaid++
        }
      }
    })

    const trendMonthly: MonthTrend[] = []
    const sortedPeriods = Array.from(allPeriods).sort()
    const last6 = sortedPeriods.slice(-6)
    for (const period of last6) {
      const md = monthlyData.get(period) || { pemasukan: 0, pengeluaran: 0 }
      trendMonthly.push({ period, pemasukan: md.pemasukan, pengeluaran: md.pengeluaran })
    }

    const currentMonthKas = kasByPeriod.get(currentPeriod) || []
    const pengeluaranByCategory: Record<string, number> = {}
    currentMonthKas.forEach((data: any) => {
      if (data.type === 'keluar') {
        const cat = data.category || 'Lainnya'
        pengeluaranByCategory[cat] = (pengeluaranByCategory[cat] || 0) + (data.amount || 0)
      }
    })

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

    allKasEntries.sort((a: any, b: any) => {
      const dateA = a.transaction_date ? (a.transaction_date.toDate ? a.transaction_date.toDate().getTime() : new Date(a.transaction_date).getTime()) : (a.created_at ? (a.created_at.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at).getTime()) : 0)
      const dateB = b.transaction_date ? (b.transaction_date.toDate ? b.transaction_date.toDate().getTime() : new Date(b.transaction_date).getTime()) : (b.created_at ? (b.created_at.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at).getTime()) : 0)
      return dateB - dateA
    })

    const latestTransactions: LatestTransaction[] = allKasEntries.slice(0, 5).map((entry: any) => {
      let dateStr = ''
      if (entry.transaction_date) {
        const d = entry.transaction_date.toDate ? entry.transaction_date.toDate() : new Date(entry.transaction_date)
        dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      } else if (entry.created_at) {
        const d = entry.created_at.toDate ? entry.created_at.toDate() : new Date(entry.created_at)
        dateStr = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
      } else {
        dateStr = '-'
      }

      return {
        id: entry.id,
        period: entry.period,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        date: dateStr,
      }
    })

    return {
      globalSaldo: globalPemasukan - globalPengeluaran,
      totalPemasukan: globalPemasukan,
      totalPengeluaran: globalPengeluaran,
      currentPeriodStats: {
        totalPaid: currentPaid,
        totalUnpaid: currentUnpaid,
        totalOccupied: currentOccupied,
        iuranTerkumpul: currentIuran,
      },
      trendMonthly,
      pengeluaranByCategory,
      latestTransactions,
    }
  })
})
