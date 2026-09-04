import { getFirestoreDb, getFirebaseAdmin } from '../../utils/firebase'
import { invalidateCachePrefix } from '../../utils/cache'
import { calculateTotal, closingBalance } from '../../utils/billing'
import type { SiteConfig } from '~/types'

export default defineEventHandler(async (event) => {
  const db = getFirestoreDb()
  const admin = getFirebaseAdmin()

  // Fetch site config
  const configDoc = await db.collection('config').doc('site').get()
  const config: SiteConfig = configDoc.exists ? configDoc.data() as SiteConfig : {
    dues_trash_flat: 25000,
    water_min_fee: 25000,
    water_price_per_cubic: 3500,
  }

  // Fetch ALL ipl_records
  const snapshot = await db.collection('ipl_records').get()
  if (snapshot.empty) {
    return { success: true, updated: 0, fixed: 0, periods: 0 }
  }

  // Group records by period and house_id
  const periodMap = new Map<string, Map<string, any>>()
  snapshot.forEach(doc => {
    const data = doc.data()
    const period = data.period
    const houseId = data.house_id
    if (!periodMap.has(period)) {
      periodMap.set(period, new Map())
    }
    periodMap.get(period)!.set(houseId, { id: doc.id, ...data })
  })

  // Sort periods chronologically
  const sortedPeriods = Array.from(periodMap.keys()).sort()

  // Track saldo_akhir per house across periods
  const houseSaldoMap = new Map<string, number>() // house_id -> last saldo_akhir

  let updated = 0
  let fixed = 0
  const chunkSize = 400

  for (const period of sortedPeriods) {
    const houseRecords = periodMap.get(period)!
    const batch = db.batch()
    let batchOps = 0

    for (const [houseId, record] of houseRecords) {
      const saldoAwal = houseSaldoMap.get(houseId) ?? 0

      // FIX DATA: Belum Terbayarkan → amount_paid = 0
      let amountPaid = record.amount_paid ?? 0
      if (record.status_iuran === 'Belum Terbayarkan' && amountPaid > 0) {
        amountPaid = 0
        fixed++
      }

      const saldoAkhir = closingBalance({
        status_rumah: record.status_rumah,
        jenis_iuran: record.jenis_iuran,
        water_meter_past: record.water_meter_past,
        water_meter_current: record.water_meter_current,
        amount_paid: amountPaid,
        saldo_awal: saldoAwal,
      }, config)

      const ref = db.collection('ipl_records').doc(record.id)
      batch.update(ref, {
        amount_paid: Math.round(amountPaid),
        saldo_awal: Math.round(saldoAwal),
        saldo_akhir: Math.round(saldoAkhir),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      })

      houseSaldoMap.set(houseId, Math.round(saldoAkhir))
      batchOps++
      updated++

      // Commit in chunks to avoid Firestore limits
      if (batchOps >= chunkSize) {
        await batch.commit()
        batchOps = 0
      }
    }

    if (batchOps > 0) {
      await batch.commit()
    }
  }

  invalidateCachePrefix('ipl:')

  return {
    success: true,
    updated,
    fixed,
    periods: sortedPeriods.length,
    periodRange: sortedPeriods.length > 0
      ? `${sortedPeriods[0]} - ${sortedPeriods[sortedPeriods.length - 1]}`
      : null,
  }
})
