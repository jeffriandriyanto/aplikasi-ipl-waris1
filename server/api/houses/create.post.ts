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

  invalidateCache(CACHE_KEYS.HOUSES)
  
  return {
    id,
    block: houseData.block,
    house_number: houseData.house_number,
    pic: houseData.pic,
    is_active: houseData.is_active,
    created_at: body.created_at ? new Date(body.created_at) : new Date(),
  }
})
