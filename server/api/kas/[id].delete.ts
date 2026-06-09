import { getFirestoreDb } from '../../utils/firebase'
import { invalidateCachePrefix } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID is required' })
  }

  const db = getFirestoreDb()
  const docRef = db.collection('kas_log').doc(id)
  const doc = await docRef.get()

  if (!doc.exists) {
    throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  }

  const data = doc.data()!
  await docRef.delete()

  invalidateCachePrefix('kas:')

  return { success: true, id }
})
