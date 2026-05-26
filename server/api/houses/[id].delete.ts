import { getFirestoreDb } from '../../utils/firebase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'House ID is required'
    })
  }

  const db = getFirestoreDb()
  await db.collection('houses').doc(id).delete()

  return { success: true }
})
