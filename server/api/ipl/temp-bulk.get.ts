// /server/api/ipl/temp-bulk.get.ts
import { getFirestoreDb } from "../../utils/firebase";

export default defineEventHandler(async (event) => {
  const db = getFirestoreDb();
  const prefix = '2026-05_';
  
  try {
    // Query dokumen yang diawali dengan '2026-05_'
    const snapshot = await db.collection('ipl_records')
      .orderBy('__name__')
      .startAt(prefix)
      .endAt(prefix + '\uf8ff')
      .get();

    if (snapshot.empty) {
      return {
        success: true,
        message: 'Tidak ada dokumen yang cocok dengan prefix 2026-05_'
      };
    }

    const batch = db.batch();
    let counter = 0;
    const details: string[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const currentMeter = data.water_meter_current || 0;

      const docRef = db.collection('ipl_records').doc(doc.id);
      
      // Samakan nilai past dengan current
      batch.update(docRef, {
        water_meter_past: currentMeter,
        updated_at: new Date() 
      });

      counter++;
      details.push(`ID: ${doc.id} -> Set past meter ke: ${currentMeter}`);
    });

    // Commit batch perubahan ke Firestore
    await batch.commit();

    return {
      success: true,
      message: `🎉 Berhasil mengeksekusi bulk update untuk ${counter} dokumen!`,
      details
    };

  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gagal menjalankan script bulk update',
      message: error.message
    });
  }
});