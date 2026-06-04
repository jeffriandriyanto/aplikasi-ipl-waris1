// /server/api/config.post.ts
import { getFirestoreDb, getFirebaseAdmin } from "../utils/firebase";
import { invalidateCache, CACHE_KEYS } from "../utils/cache";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validasi tipe data input agar dipastikan tersimpan sebagai Number
  const dues_trash_flat = Number(body.dues_trash_flat);
  const water_min_fee = Number(body.water_min_fee);
  const water_price_per_cubic = Number(body.water_price_per_cubic);

  if (
    isNaN(dues_trash_flat) ||
    isNaN(water_min_fee) ||
    isNaN(water_price_per_cubic)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Semua nilai master harus berupa angka yang valid.",
    });
  }

  const db = getFirestoreDb();
  const admin = getFirebaseAdmin();
  const ref = db.collection("config").doc("site");

  try {
    await ref.set(
      {
        dues_trash_flat,
        water_min_fee,
        water_price_per_cubic,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    // Invalidate cache so next read gets fresh data
    invalidateCache(CACHE_KEYS.CONFIG);

    return { success: true };
  } catch (error: any) {
    console.error("Error saving site config:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Gagal menyimpan konfigurasi ke database.",
    });
  }
});
