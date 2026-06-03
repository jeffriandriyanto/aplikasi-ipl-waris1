import { getFirestoreDb } from "../../utils/firebase";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const db = getFirestoreDb();

  // Validasi ID dokumen dan data minimal yang wajib dikirim
  if (!body.id || !body.pic) {
    throw createError({
      statusCode: 400,
      statusMessage: "House ID and PIC are required",
    });
  }

  const houseRef = db.collection("houses").doc(body.id);
  const docSnap = await houseRef.get();

  if (!docSnap.exists) {
    throw createError({
      statusCode: 404,
      statusMessage: "House record not found",
    });
  }

  // Lakukan partial update hanya pada field PIC (dan updated_at jika dibutuhkan)
  const updateData = {
    pic: body.pic,
    updated_at: new Date(), // Opsional: jejak audit perubahan data
  };

  await houseRef.update(updateData);

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
    created_at: parseFirestoreDate(data.created_at),
  };
});
