const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ Error: FIREBASE_SERVICE_ACCOUNT tidak ditemukan di .env!");
  process.exit(1);
}

initializeApp({
  credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
});

const db = getFirestore();
const DRY_RUN = process.argv.includes("--dry-run");

// Mirroring server/utils/billing.ts
function calculateTotal(r, config) {
  if (r.status_rumah === "Kosong" || r.status_rumah === "") return 0;

  const usage = Math.max(0, r.water_meter_current - r.water_meter_past);
  let total = 0;

  if ((r.jenis_iuran || "").includes("Sampah")) {
    total += config.dues_trash_flat || 25000;
  }

  if ((r.jenis_iuran || "").includes("Air")) {
    const minFee = config.water_min_fee || 25000;
    const pricePerCubic = config.water_price_per_cubic || 3500;
    if (r.status_rumah === "Kosong" && usage === 0) {
    } else {
      total += usage <= 10 ? minFee : minFee + (usage - 10) * pricePerCubic;
    }
  }

  return total;
}

function closingBalance(r, config) {
  if (r.write_off) return 0;
  const bill = calculateTotal(r, config);
  return (r.saldo_awal ?? 0) + (r.amount_paid ?? 0) - bill;
}

async function fetchAllIpl() {
  const snap = await db.collection("ipl_records").get();
  return snap.docs.map((d) => ({ ref: d.ref, id: d.id, ...d.data() }));
}

// 1. Samakan doc ID dengan {period}_{house_id}
async function migrateDocIds() {
  console.log("\n[1/3] Migrasi doc ID ipl_records");
  const records = await fetchAllIpl();
  const existingIds = new Set(records.map((r) => r.id));

  const moves = [];
  for (const r of records) {
    const target = `${r.period}_${r.house_id}`;
    if (r.id === target) continue;
    if (existingIds.has(target)) {
      console.log(`  ⚠️  target sudah ada, dilewati: ${r.id} -> ${target}`);
      continue;
    }
    moves.push({ from: r.id, to: target, data: { ...r } });
  }

  console.log(`  perlu dimigrasi: ${moves.length} dari ${records.length}`);
  moves.forEach((m) => console.log(`    ${m.from}  ->  ${m.to}`));

  if (DRY_RUN || moves.length === 0) return moves.length;

  const CHUNK = 200;
  for (let i = 0; i < moves.length; i += CHUNK) {
    const batch = db.batch();
    moves.slice(i, i + CHUNK).forEach((m) => {
      const { ref, id, ...data } = m.data;
      batch.set(db.collection("ipl_records").doc(m.to), data);
      batch.delete(db.collection("ipl_records").doc(m.from));
    });
    await batch.commit();
  }
  console.log(`  ✅ ${moves.length} dokumen dimigrasi`);
  return moves.length;
}

// 2. Pulihkan water_meter_past yang hilang (past=0 padahal bulan sebelumnya ada angka)
async function fixMeterChain() {
  console.log("\n[2/3] Perbaikan water_meter_past");
  const records = await fetchAllIpl();

  const byHouse = new Map();
  records.forEach((r) => {
    if (!byHouse.has(r.house_id)) byHouse.set(r.house_id, []);
    byHouse.get(r.house_id).push(r);
  });

  const fixes = [];
  for (const recs of byHouse.values()) {
    recs.sort((a, b) => a.period.localeCompare(b.period));
    for (let i = 1; i < recs.length; i++) {
      const prev = recs[i - 1];
      const cur = recs[i];
      const prevCur = prev.water_meter_current || 0;
      const curPast = cur.water_meter_past || 0;
      if (curPast === prevCur) continue;
      if (curPast !== 0) continue;
      if (prevCur <= 0) continue;
      fixes.push({
        ref: cur.ref,
        id: cur.id,
        house: cur.house_number,
        period: cur.period,
        from: curPast,
        to: prevCur,
      });
    }
  }

  console.log(`  ditemukan: ${fixes.length}`);
  fixes.forEach((f) =>
    console.log(`    ${f.period} ${f.house}: ${f.from} -> ${f.to}   [${f.id}]`),
  );

  if (DRY_RUN || fixes.length === 0) return fixes.length;

  const batch = db.batch();
  fixes.forEach((f) => batch.update(f.ref, { water_meter_past: f.to }));
  await batch.commit();
  console.log(`  ✅ ${fixes.length} meter diperbaiki`);
  return fixes.length;
}

// 3. Hitung ulang saldo_awal / saldo_akhir (pola sama /api/ipl/recalculate)
async function recalculate() {
  console.log("\n[3/3] Recalculate saldo");

  const configDoc = await db.collection("config").doc("site").get();
  const config = configDoc.exists
    ? configDoc.data()
    : { dues_trash_flat: 25000, water_min_fee: 25000, water_price_per_cubic: 3500 };

  const records = await fetchAllIpl();
  if (records.length === 0) {
    console.log("  tidak ada data");
    return { updated: 0, changed: 0, fixed: 0 };
  }

  const periodMap = new Map();
  records.forEach((r) => {
    if (!periodMap.has(r.period)) periodMap.set(r.period, new Map());
    periodMap.get(r.period).set(r.house_id, r);
  });

  const sortedPeriods = [...periodMap.keys()].sort();
  const houseSaldoMap = new Map();
  let updated = 0;
  let changed = 0;
  let fixed = 0;

  for (const period of sortedPeriods) {
    const houseRecords = periodMap.get(period);
    let batch = db.batch();
    let ops = 0;

    for (const [houseId, record] of houseRecords) {
      const saldoAwal = houseSaldoMap.get(houseId) ?? 0;

      let amountPaid = record.amount_paid ?? 0;
      if (record.status_iuran === "Belum Terbayarkan" && amountPaid > 0) {
        amountPaid = 0;
        fixed++;
      }

      const saldoAkhir = closingBalance(
        {
          status_rumah: record.status_rumah,
          jenis_iuran: record.jenis_iuran,
          water_meter_past: record.water_meter_past,
          water_meter_current: record.water_meter_current,
          amount_paid: amountPaid,
          saldo_awal: saldoAwal,
          write_off: !!record.write_off,
        },
        config,
      );

      const patch = {
        amount_paid: Math.round(amountPaid),
        saldo_awal: Math.round(saldoAwal),
        saldo_akhir: Math.round(saldoAkhir),
        updated_at: FieldValue.serverTimestamp(),
      };

      if (
        (record.amount_paid ?? 0) !== patch.amount_paid ||
        (record.saldo_awal ?? 0) !== patch.saldo_awal ||
        (record.saldo_akhir ?? 0) !== patch.saldo_akhir
      ) {
        changed++;
      }

      if (!DRY_RUN) batch.update(record.ref, patch);
      houseSaldoMap.set(houseId, Math.round(saldoAkhir));
      ops++;
      updated++;

      if (ops >= 400) {
        if (!DRY_RUN) await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }

    if (ops > 0 && !DRY_RUN) await batch.commit();
  }

  console.log(`  records diproses : ${updated}`);
  console.log(`  saldo berubah    : ${changed}`);
  console.log(`  amount_paid dibetulkan: ${fixed}`);
  if (DRY_RUN) console.log("  (dry-run, tidak ada yang ditulis)");

  return { updated, changed, fixed };
}

async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN (tidak ada yang ditulis)" : "🛠️  REPAIR MULAI");

  const moved = await migrateDocIds();
  const meters = await fixMeterChain();
  const { updated, changed, fixed } = await recalculate();

  console.log("\n=== RINGKASAN ===");
  console.log(`  doc ID dimigrasi : ${moved}`);
  console.log(`  meter diperbaiki : ${meters}`);
  console.log(`  saldo diproses   : ${updated} (${changed} berubah, ${fixed} paid dibetulkan)`);
  if (DRY_RUN) console.log("\nℹ️  Jalankan ulang tanpa --dry-run untuk menerapkan.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Repair gagal:", err.message);
    process.exit(1);
  });
