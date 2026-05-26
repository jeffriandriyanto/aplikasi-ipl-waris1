import { getFirestoreDb, getFirebaseAdmin } from '../../utils/firebase'
import { generateIplRecordId, generateHouseId } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const records = body.records || []
  
  if (!Array.isArray(records) || records.length === 0) {
    return { success: true, count: 0 }
  }

  const db = getFirestoreDb()
  const admin = getFirebaseAdmin()
  const chunkSize = 400
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize)
    const batch = db.batch()

    chunk.forEach((record: any) => {
      const houseId = record.house_id || generateHouseId(record.block, record.house_number)
      const id = generateIplRecordId(record.period, record.block, record.house_number)
      const ref = db.collection('ipl_records').doc(id)
      
      batch.set(ref, {
        period: record.period,
        house_id: houseId,
        block: record.block,
        house_number: record.house_number,
        status_rumah: record.status_rumah,
        jenis_iuran: record.jenis_iuran,
        status_iuran: record.status_iuran,
        water_meter_past: record.water_meter_past,
        water_meter_current: record.water_meter_current,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()
  }

  return { success: true, count: records.length }
})
