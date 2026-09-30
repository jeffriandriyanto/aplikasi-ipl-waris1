const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

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

// Semua collection yang ada di project ini
const COLLECTIONS = ["config", "houses", "ipl_records", "kas_log", "users"];

// 3. Konversi objek Firestore (Timestamp, GeoPoint, DocumentReference, Bytes)
//    menjadi JSON yang aman disimpan & dibaca ulang.
function toJsonSafe(value) {
  if (value === null || value === undefined) return value;

  if (value instanceof Date) return { __type: "date", value: value.toISOString() };

  // Firestore Timestamp
  if (typeof value.toDate === "function" && typeof value.seconds === "number") {
    return { __type: "timestamp", value: value.toDate().toISOString() };
  }

  // Firestore GeoPoint
  if (typeof value.latitude === "number" && typeof value.longitude === "number") {
    return { __type: "geopoint", latitude: value.latitude, longitude: value.longitude };
  }

  // Firestore DocumentReference
  if (typeof value.path === "string" && typeof value.collection === "object") {
    return { __type: "reference", path: value.path };
  }

  // Firestore Bytes / Buffer
  if (typeof value.toBase64 === "function") {
    return { __type: "bytes", base64: value.toBase64() };
  }

  if (Array.isArray(value)) return value.map(toJsonSafe);

  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toJsonSafe(v);
    return out;
  }

  return value;
}

async function runBackup() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19);

  const outDir = path.join(__dirname, "backup", timestamp);

  // Jangan timpa backup yang sudah ada
  if (fs.existsSync(outDir)) {
    console.error(`❌ Folder backup sudah ada: ${outDir}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`🗂️  Mulai backup ke ${outDir}\n`);

  const manifest = {
    projectId: serviceAccount.project_id,
    createdAt: new Date().toISOString(),
    collections: {},
  };

  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...toJsonSafe(d.data()) }));

    const file = path.join(outDir, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2), "utf-8");

    manifest.collections[name] = docs.length;
    console.log(`  ✅ ${name}.json  (${docs.length} dokumen)`);
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8",
  );

  const total = Object.values(manifest.collections).reduce((a, b) => a + b, 0);
  console.log(`\n🎉 Selesai! ${total} dokumen dari ${COLLECTIONS.length} collection.`);
  console.log(`   Lokasi: ${outDir}`);
}

runBackup().catch((err) => {
  console.error("❌ Backup gagal:", err.message);
  process.exit(1);
});
