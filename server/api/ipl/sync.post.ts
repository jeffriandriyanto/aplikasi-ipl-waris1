import { getFirestoreDb, getFirebaseAdmin } from '../../utils/firebase'
import { invalidateCachePrefix } from '../../utils/cache'
import { getHouseIdMap, resolveHouseId } from '../../utils/houses'
import { closingBalance } from '../../utils/billing'
import { generateIplRecordId } from '~/types'
import type { SiteConfig } from '~/types'

const PERIOD_REGEX = /^\d{4}-\d{2}$/
const VALID_HOUSE_STATUSES = new Set(['Ditinggali', 'Disewakan', 'Kosong', ''])
const VALID_DUES_TYPES = new Set(['Air & Sampah', 'Air'])
const VALID_PAYMENT_STATUSES = new Set(['Terbayarkan', 'Belum Terbayarkan'])

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const records = body.records || []

  if (!Array.isArray(records) || records.length === 0) {
    return { success: true, count: 0 }
  }

  if (records.length > 500) {
    throw createError({ statusCode: 400, statusMessage: 'Too many records (max 500)' })
  }

  const db = getFirestoreDb()
  const admin = getFirebaseAdmin()

  // Fetch site config for saldo_akhir calculation
  const configDoc = await db.collection('config').doc('site').get()
  const config: SiteConfig = configDoc.exists ? configDoc.data() as SiteConfig : {
    dues_trash_flat: 25000,
    water_min_fee: 25000,
    water_price_per_cubic: 3500,
  }

  const chunkSize = 400
  let written = 0

  const houseIdMap = await getHouseIdMap()

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize)
    const batch = db.batch()

    chunk.forEach((record: any) => {
      if (!record.block || !record.house_number || !record.period) return
      if (typeof record.block !== 'string' || typeof record.house_number !== 'string') return
      if (!PERIOD_REGEX.test(record.period)) return
      if (!VALID_HOUSE_STATUSES.has(record.status_rumah)) return
      if (!VALID_DUES_TYPES.has(record.jenis_iuran)) return
      if (!VALID_PAYMENT_STATUSES.has(record.status_iuran)) return
      if (typeof record.water_meter_past !== 'number' || typeof record.water_meter_current !== 'number') return
      if (record.water_meter_past < 0 || record.water_meter_current < 0) return

      const houseId = resolveHouseId(houseIdMap, record.block, record.house_number, record.house_id)
      const id = generateIplRecordId(record.period, record.block, record.house_number)
      const ref = db.collection('ipl_records').doc(id)

      const saldoAwal = typeof record.saldo_awal === 'number' ? record.saldo_awal : 0

      const isWriteOff = !!record.write_off

      // Calculate saldo_akhir using server-side billing
      const saldoAkhir = closingBalance({
        status_rumah: record.status_rumah,
        jenis_iuran: record.jenis_iuran,
        water_meter_past: record.water_meter_past,
        water_meter_current: record.water_meter_current,
        amount_paid: record.amount_paid,
        saldo_awal: saldoAwal,
        write_off: isWriteOff,
      }, config)

      const data: any = {
        period: record.period,
        house_id: houseId,
        block: String(record.block).trim(),
        house_number: String(record.house_number).trim(),
        status_rumah: record.status_rumah,
        jenis_iuran: record.jenis_iuran,
        status_iuran: record.status_iuran,
        water_meter_past: Math.max(0, Math.round(record.water_meter_past)),
        water_meter_current: Math.max(0, Math.round(record.water_meter_current)),
        saldo_awal: Math.round(saldoAwal),
        saldo_akhir: Math.round(saldoAkhir),
        write_off: isWriteOff,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Belum Terbayarkan = amount_paid harus 0
      if (record.status_iuran === 'Belum Terbayarkan') {
        data.amount_paid = 0
      } else if (record.amount_paid != null && typeof record.amount_paid === 'number' && record.amount_paid >= 0) {
        data.amount_paid = Math.round(record.amount_paid)
      }

      batch.set(ref, data)
      written++
    })

    await batch.commit()
  }

  invalidateCachePrefix('ipl:')

  return { success: true, count: written }
})
