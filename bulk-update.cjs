// bulk-update.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Sesuaikan path ke file service account json milik Firebase Anda
// Jika Anda tidak punya file json-nya, Anda bisa download dulu dari:
// Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
const serviceAccount = require('./path/to/serviceAccountKey.json'); 

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function runBulkUpdate() {
  const prefix = '2026-05_';
  console.log(`[START] Mencari dokumen dengan prefix: ${prefix}...`);

  try {
    // Query dokumen yang diawali dengan '2026-05_'
    const snapshot = await db.collection('ipl_records')
      .orderBy('__name__')
      .startAt(prefix)
      .endAt(prefix + '\uf8ff')
      .get();

    if (snapshot.empty) {
      console.log('❌ Tidak ada dokumen yang cocok.');
      return;
    }

    console.log(` find ${snapshot.size} dokumen. Memulai proses batch update...`);

    const batch = db.batch();
    let counter = 0;

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
      console.log(`-> Disiapkan: ID [${doc.id}] | meter: ${currentMeter}`);
    });

    // Eksekusi perubahan ke Firestore
    await batch.commit();
    console.log(`\n🎉 [SUCCESS] Berhasil mengupdate ${counter} dokumen!`);

  } catch (error) {
    console.error('❌ [ERROR] Terjadi kesalahan saat bulk update:', error);
  }
}

runBulkUpdate();