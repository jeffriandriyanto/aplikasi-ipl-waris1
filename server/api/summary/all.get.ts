import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { House } from '~/types'

interface PeriodBreakdown {
  period: string
  iuranTerkumpul: number
  rumahTerbayar: number
  rumahBelumBayar: number
  kasMasukLainnya: number
  totalPengeluaran: number
  saldoPeriod: number
}

export default defineEventHandler(async () => {
  return cachedFetch('summary:all', CACHE_TTL.SUMMARY, async () => {
    const db = getFirestoreDb()

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

    // Fetch ALL IPL records
    const iplSnap = await db.collection('ipl_records').get()

    // Group by period, filtering by active houses
    const iplByPeriod = new Map<string, any[]>()
    iplSnap.forEach(doc => {
      const data = doc.data()
      if (!activeHouseIds.has(data.house_id)) return
      const period = data.period
      if (!iplByPeriod.has(period)) iplByPeriod.set(period, [])
      iplByPeriod.get(period)!.push(data)
    })

    // Fetch ALL kas_log entries
    const kasSnap = await db.collection('kas_log').get()

    const kasByPeriod = new Map<string, any[]>()
    kasSnap.forEach(doc => {
      const data = doc.data()
      const period = data.period
      if (!kasByPeriod.has(period)) kasByPeriod.set(period, [])
      kasByPeriod.get(period)!.push(data)
    })

    // Merge all periods
    const allPeriods = new Set<string>([...iplByPeriod.keys(), ...kasByPeriod.keys()])
    const breakdown: PeriodBreakdown[] = []

    let grandIuran = 0
    let grandKasMasuk = 0
    let grandPengeluaran = 0

    for (const period of Array.from(allPeriods).sort()) {
      const iplRecords = iplByPeriod.get(period) || []
      const kasEntries = kasByPeriod.get(period) || []

      let iuranTerkumpul = 0
      let rumahTerbayar = 0
      let rumahBelumBayar = 0

      iplRecords.forEach((data: any) => {
        iuranTerkumpul += data.amount_paid || 0
        if (data.status_iuran === 'Terbayarkan') {
          rumahTerbayar++
        } else {
          rumahBelumBayar++
        }
      })

      let kasMasukLainnya = 0
      let totalPengeluaran = 0

      kasEntries.forEach((data: any) => {
        if (data.type === 'masuk') {
          kasMasukLainnya += data.amount || 0
        } else if (data.type === 'keluar') {
          totalPengeluaran += data.amount || 0
        }
      })

      const saldoPeriod = iuranTerkumpul + kasMasukLainnya - totalPengeluaran

      grandIuran += iuranTerkumpul
      grandKasMasuk += kasMasukLainnya
      grandPengeluaran += totalPengeluaran

      breakdown.push({
        period,
        iuranTerkumpul,
        rumahTerbayar,
        rumahBelumBayar,
        kasMasukLainnya,
        totalPengeluaran,
        saldoPeriod,
      })
    }

    return {
      grandTotal: {
        iuranTerkumpul: grandIuran,
        kasMasukLainnya: grandKasMasuk,
        totalPengeluaran: grandPengeluaran,
        saldoAkhir: grandIuran + grandKasMasuk - grandPengeluaran,
      },
      breakdown,
    }
  })
})
