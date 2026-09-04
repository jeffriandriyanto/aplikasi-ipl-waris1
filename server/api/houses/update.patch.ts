import { getFirestoreDb } from "../../utils/firebase";
import { invalidateCache, CACHE_KEYS } from "../../utils/cache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = getFirestoreDb();

  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "House ID is required",
    });
  }

  const updateData: Record<string, any> = {};

  if (body.pic !== undefined) {
    updateData.pic = body.pic;
  }

  if (body.is_active !== undefined) {
    updateData.is_active = !!body.is_active;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "No fields to update",
    });
  }

  updateData.updated_at = new Date();

  const houseRef = db.collection("houses").doc(body.id);
  const docSnap = await houseRef.get();

  if (!docSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: "House record not found",
    });
  }

  await houseRef.update(updateData);

  invalidateCache(CACHE_KEYS.HOUSES);

  const existing = docSnap.data()!;

  return {
    id: body.id,
    block: existing.block,
    house_number: existing.house_number,
    pic: updateData.pic ?? existing.pic,
    is_active: updateData.is_active ?? (existing.is_active !== false),
    created_at: existing.created_at?.toDate?.() ?? null,
  };
});
