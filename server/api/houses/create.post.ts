import { getFirestoreDb, getFirebaseAdmin } from '../../utils/firebase'
import { invalidateCache, CACHE_KEYS } from '../../utils/cache'
import { generateHouseId } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const db = getFirestoreDb()
  const admin = getFirebaseAdmin()
  
  if (!body.block || !body.house_number) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Block, house_number'
    })
  }

  const id = generateHouseId(body.block, body.house_number)
  
  const houseData = {
    block: body.block,
    house_number: body.house_number,
    pic: body.pic || "-",
    is_active: body.is_active !== false,
    created_at: body.created_at ? admin.firestore.Timestamp.fromDate(new Date(body.created_at)) : admin.firestore.FieldValue.serverTimestamp(),
  }

  await db.collection('houses').doc(id).set(houseData)

  // Invalidate cache
  invalidateCache(CACHE_KEYS.HOUSES)

  // Fetch and return the newly created document data to allow immediate reactive array update
  const createdDoc = await db.collection('houses').doc(id).get()
  const data = createdDoc.data()!
  
  return {
    id: createdDoc.id,
    block: data.block,
    house_number: data.house_number,
    pic: data.pic || "",
    is_active: data.is_active !== false,
    created_at: data.created_at ? data.created_at.toDate() : null,
  }
})
