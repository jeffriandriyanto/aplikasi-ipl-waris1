const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const dotenv = require("dotenv");
const fs = require("fs");

// 1. Ambil config dari file .env
dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ Error: FIREBASE_SERVICE_ACCOUNT tidak ditemukan di .env!");
  process.exit(1);
}

// 2. Inisialisasi Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// 3. Baca file JSON data rumah
const rawData = fs.readFileSync("./houses-data.json", "utf-8");
const housesData = JSON.parse(rawData);

async function runImport() {
  console.log(`🔄 Menyiapkan import untuk ${housesData.length} data rumah...`);

  // Firestore Batch maksimal menampung 500 operasi per commit
  const batch = db.batch();

  housesData.forEach((house) => {
    // Paksa dikonversi ke String dulu biar aman dari angka murni atau data null
    const cleanBlock = String(house.block || "").trim();
    const cleanNumber = String(house.house_number || "").trim();

    // Jika field wajib ternyata kosong setelah di-trim, skip atau berikan default
    if (!cleanBlock || !cleanNumber) {
      console.warn(
        `⚠️ Menemukan data kosong, skipping: Blok [${cleanBlock}], No [${cleanNumber}]`,
      );
      return;
    }

    const docId = `${cleanBlock.toLowerCase()}_${cleanNumber.toLowerCase()}`
      .replace(/\s+/g, "")
      .replace(/&/g, "-");

    const docRef = db.collection("houses").doc(docId);

    batch.set(docRef, {
      block: cleanBlock,
      house_number: cleanNumber,
      pic: house.pic ? String(house.pic).trim() : "-",
      created_at: new Date().toISOString(),
    });
  });

  try {
    // Tembak semua data sekaligus ke Firestore Cloud
    await batch.commit();
    console.log(
      `✅ BOOM! Sukses memasukkan ${housesData.length} data rumah ke collection 'houses'!`,
    );
  } catch (error) {
    console.error("❌ Waduh, gagal batch import:", error);
  }
}

runImport();
