import { getFirestoreDb } from '../../utils/firebase'
import { invalidateCachePrefix } from '../../utils/cache'

const PERIOD_REGEX = /^\d{4}-\d{2}$/

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const period = body.period as string

  if (!period || !PERIOD_REGEX.test(period)) {
    throw createError({ statusCode: 400, statusMessage: 'Period is required (format: YYYY-MM)' })
  }

  const db = getFirestoreDb()
  let deletedIpl = 0
  let deletedKas = 0

  // Delete ipl_records for this period
  const iplSnap = await db.collection('ipl_records')
    .where('period', '==', period)
    .get()

  if (!iplSnap.empty) {
    const chunkSize = 400
    const docs = iplSnap.docs
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize)
      const batch = db.batch()
      chunk.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
      deletedIpl += chunk.length
    }
  }

  // Delete kas_log for this period
  const kasSnap = await db.collection('kas_log')
    .where('period', '==', period)
    .get()

  if (!kasSnap.empty) {
    const chunkSize = 400
    const docs = kasSnap.docs
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize)
      const batch = db.batch()
      chunk.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
      deletedKas += chunk.length
    }
  }

  invalidateCachePrefix('ipl:')
  invalidateCachePrefix('kas:')

  return {
    success: true,
    period,
    deletedIpl,
    deletedKas,
    total: deletedIpl + deletedKas,
  }
})
