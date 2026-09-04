import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import { calculateTotal } from '../../utils/billing'
import type { SiteConfig } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const block = (query.block as string || '').trim()
  const houseNumber = (query.house_number as string || '').trim()

  if (!block || !houseNumber) {
    throw createError({ statusCode: 400, statusMessage: 'block and house_number are required' })
  }

  const db = getFirestoreDb()

  const config = await cachedFetch<SiteConfig>(CACHE_KEYS.CONFIG, CACHE_TTL.CONFIG, async () => {
    const configDoc = await db.collection('config').doc('site').get()
    return configDoc.exists ? configDoc.data() as SiteConfig : {
      dues_trash_flat: 25000,
      water_min_fee: 25000,
      water_price_per_cubic: 3500,
    }
  })

  const snapshot = await db.collection('ipl_records')
    .where('block', '==', block)
    .get()

  if (snapshot.empty) {
    return { records: [] }
  }

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').trim()
  const targetNorm = normalize(houseNumber)

  const records: any[] = []
  snapshot.forEach(doc => {
    const data = doc.data()
    const hn = normalize(data.house_number || '')
    if (hn !== targetNorm) return

    const record = {
      period: data.period,
      status_rumah: data.status_rumah,
      jenis_iuran: data.jenis_iuran,
      water_meter_past: data.water_meter_past ?? 0,
      water_meter_current: data.water_meter_current ?? 0,
      amount_paid: data.amount_paid ?? 0,
      saldo_awal: data.saldo_awal ?? 0,
      saldo_akhir: data.saldo_akhir ?? 0,
      status_iuran: data.status_iuran,
      tagihan: calculateTotal({
        status_rumah: data.status_rumah,
        jenis_iuran: data.jenis_iuran,
        water_meter_past: data.water_meter_past ?? 0,
        water_meter_current: data.water_meter_current ?? 0,
      }, config),
    }
    records.push(record)
  })

  records.sort((a, b) => a.period.localeCompare(b.period))

  return { records }
})
