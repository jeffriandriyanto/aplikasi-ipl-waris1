import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import { closingBalance } from '../../utils/billing'
import type { IplRecord, HouseStatus, DuesType, PaymentStatus, SiteConfig } from '~/types'

function getPreviousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const prevDate = new Date(year!, (month || 1) - 2, 1)
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = query.period as string
  const houseId = query.house_id as string

  if (!period) {
    throw createError({ statusCode: 400, statusMessage: 'Period is required' })
  }
  if (!houseId) {
    throw createError({ statusCode: 400, statusMessage: 'house_id is required' })
  }

  const db = getFirestoreDb()

  // Fetch site config from cache
  const config = await cachedFetch<SiteConfig>(CACHE_KEYS.CONFIG, CACHE_TTL.CONFIG, async () => {
    const configDoc = await db.collection('config').doc('site').get()
    return configDoc.exists ? configDoc.data() as SiteConfig : {
      dues_trash_flat: 25000,
      water_min_fee: 25000,
      water_price_per_cubic: 3500,
    }
  })

  // Fetch house info from cache
  const houses = await cachedFetch<{ id: string; block: string; house_number: string; pic: string; is_active: boolean }[]>(
    CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
      const snapshot = await db.collection('houses').get()
      const result: { id: string; block: string; house_number: string; pic: string; is_active: boolean }[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        result.push({
          id: doc.id,
          block: data.block,
          house_number: data.house_number,
          pic: data.pic,
          is_active: data.is_active !== false,
        })
      })
      return result
    }
  )

  const house = houses.find(h => h.id === houseId)
  if (!house) {
    throw createError({ statusCode: 404, statusMessage: 'House not found' })
  }

  // Fetch current period record
  const currentDoc = await db.collection('ipl_records')
    .doc(`${period}_${houseId}`)
    .get()

  // Fetch previous period record for saldo carry-over
  const prevPeriod = getPreviousPeriod(period)
  const prevDoc = await db.collection('ipl_records')
    .doc(`${prevPeriod}_${houseId}`)
    .get()

  const prevData = prevDoc.exists ? prevDoc.data() : null
  const saldoAwal = prevData?.saldo_akhir ?? 0

  let record: IplRecord

  if (currentDoc.exists) {
    const data = currentDoc.data()!
    record = {
      id: currentDoc.id,
      period: data.period,
      house_id: data.house_id,
      block: data.block,
      house_number: data.house_number,
      status_rumah: data.status_rumah as HouseStatus,
      jenis_iuran: data.jenis_iuran as DuesType,
      status_iuran: data.status_iuran as PaymentStatus,
      water_meter_past: data.water_meter_past,
      water_meter_current: data.water_meter_current,
      amount_paid: data.amount_paid ?? undefined,
      saldo_awal: saldoAwal,
      saldo_akhir: undefined,
      updated_at: data.updated_at ? data.updated_at.toDate() : null,
    }
  } else {
    record = {
      period,
      house_id: houseId,
      block: house.block,
      house_number: house.house_number,
      status_rumah: (prevData?.status_rumah || '') as HouseStatus,
      jenis_iuran: (prevData?.jenis_iuran || 'Air & Sampah') as DuesType,
      status_iuran: 'Belum Terbayarkan',
      water_meter_past: prevData?.water_meter_current || 0,
      water_meter_current: 0,
      amount_paid: undefined,
      saldo_awal: saldoAwal,
      saldo_akhir: undefined,
      updated_at: null,
    }
  }

  record.saldo_akhir = closingBalance(record, config)

  return { record, config }
})
