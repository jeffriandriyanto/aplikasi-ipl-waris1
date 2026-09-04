import { getFirestoreDb, getFirebaseAdmin } from '../../utils/firebase'
import { invalidateCachePrefix } from '../../utils/cache'
import { closingBalance } from '../../utils/billing'
import { generateIplRecordId, generateHouseId } from '~/types'
import type { SiteConfig } from '~/types'

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

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize)
    const batch = db.batch()

    chunk.forEach((record: any) => {
      // Minimal validation: only need block, house_number, period
      if (!record.block || !record.house_number || !record.period) return

      const houseId = record.house_id || generateHouseId(record.block, record.house_number)
      const id = generateIplRecordId(record.period, record.block, record.house_number)
      const ref = db.collection('ipl_records').doc(id)

      const statusRumah = record.status_rumah || ''
      const jenisIuran = record.jenis_iuran || 'Air & Sampah'
      const statusIuran = record.status_iuran || 'Belum Terbayarkan'
      const waterMeterPast = typeof record.water_meter_past === 'number' ? record.water_meter_past : 0
      const waterMeterCurrent = typeof record.water_meter_current === 'number' ? record.water_meter_current : 0
      const amountPaid = typeof record.amount_paid === 'number' ? record.amount_paid : 0
      const saldoAwal = typeof record.saldo_awal === 'number' ? record.saldo_awal : 0

      // Calculate saldo_akhir
      const saldoAkhir = closingBalance({
        status_rumah: statusRumah,
        jenis_iuran: jenisIuran,
        water_meter_past: waterMeterPast,
        water_meter_current: waterMeterCurrent,
        amount_paid: amountPaid,
        saldo_awal: saldoAwal,
      }, config)

      const data: any = {
        period: record.period,
        house_id: houseId,
        block: String(record.block).trim(),
        house_number: String(record.house_number).trim(),
        status_rumah: statusRumah,
        jenis_iuran: jenisIuran,
        status_iuran: statusIuran,
        water_meter_past: Math.max(0, Math.round(waterMeterPast)),
        water_meter_current: Math.max(0, Math.round(waterMeterCurrent)),
        saldo_awal: Math.round(saldoAwal),
        saldo_akhir: Math.round(saldoAkhir),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Belum Terbayarkan = amount_paid harus 0
      if (statusIuran === 'Belum Terbayarkan') {
        data.amount_paid = 0
      } else {
        data.amount_paid = Math.max(0, Math.round(amountPaid))
      }

      batch.set(ref, data)
      written++
    })

    await batch.commit()
  }

  invalidateCachePrefix('ipl:')

  return { success: true, count: written }
})
