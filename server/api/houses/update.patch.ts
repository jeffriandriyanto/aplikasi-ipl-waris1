import { getFirestoreDb } from "../../utils/firebase";
import { invalidateCache, CACHE_KEYS } from "../../utils/cache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = getFirestoreDb();

  // Validasi ID dokumen
  if (!body.id) {
    throw createError({
      statusCode: 400,
      statusMessage: "House ID is required",
    });
  }

  // Build update data dynamically
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

  // Invalidate cache
  invalidateCache(CACHE_KEYS.HOUSES);

  // Ambil data terbaru untuk dikembalikan ke client-side state
  const updatedDoc = await houseRef.get();
  const data = updatedDoc.data()!;

  // Fungsi helper untuk handle konversi tanggal secara aman
  const parseFirestoreDate = (dateField: any) => {
    if (!dateField) return null;

    // Jika tipe data adalah Firestore Timestamp asli yang punya method toDate
    if (typeof dateField.toDate === "function") {
      return dateField.toDate();
    }

    // Jika tipenya object _seconds (struktur internal Timestamp saat serialisasi)
    if (dateField._seconds) {
      return new Date(dateField._seconds * 1000);
    }

    // Jika tipenya string ISO atau instance Date bawaan JS
    const parsed = new Date(dateField);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  return {
    id: updatedDoc.id,
    block: data.block,
    house_number: data.house_number,
    pic: data.pic,
    is_active: data.is_active !== false,
    created_at: parseFirestoreDate(data.created_at),
  };
});
