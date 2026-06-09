import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { SiteConfig } from '~/types'
import { DEFAULT_SITE_CONFIG } from '~/types'

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
  return cachedFetch('summary:all', CACHE_TTL.IPL_RECORDS, async () => {
    const db = getFirestoreDb()

    const configData = await cachedFetch<SiteConfig>(CACHE_KEYS.CONFIG, CACHE_TTL.CONFIG, async () => {
      const configSnap = await db.collection('config').doc('site').get()
      return configSnap.exists ? (configSnap.data() as SiteConfig) : DEFAULT_SITE_CONFIG
    })

    // Fetch ALL IPL records
    const iplSnap = await db.collection('ipl_records').get()

    // Group by period
    const iplByPeriod = new Map<string, any[]>()
    iplSnap.forEach(doc => {
      const data = doc.data()
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
        if (data.status_iuran === 'Terbayarkan') {
          rumahTerbayar++
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
          iuranTerkumpul += total
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
