import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  type Firestore,
  Timestamp,
} from "firebase/firestore";
import type {
  House,
  IplRecord,
  DashboardStats,
  HouseStatus,
  DuesType,
  PaymentStatus,
  SiteConfig,
} from "~/types";
import {
  generateHouseId,
  generateIplRecordId,
  OCCUPIED_STATUSES,
  DEFAULT_SITE_CONFIG,
} from "~/types";

/**
 * Composable for all Firestore CRUD operations.
 */
export function useDatabase() {
  const { db } = useFirebase();

  // =====================
  // HOUSES CRUD
  // =====================

  async function getHouses(): Promise<House[]> {
    const snapshot = await getDocs(
      query(
        collection(db.value, "houses"),
        orderBy("block"),
        orderBy("house_number"),
      ),
    );
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      created_at: d.data().created_at?.toDate?.() || null,
    })) as House[];
  }

  async function getHouse(id: string): Promise<House | null> {
    const docSnap = await getDoc(doc(db.value, "houses", id));
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...docSnap.data(),
      created_at: docSnap.data().created_at?.toDate?.() || null,
    } as House;
  }

  async function saveHouse(house: House): Promise<void> {
    const id = generateHouseId(house.block, house.house_number);
    await setDoc(doc(db.value, "houses", id), {
      block: house.block,
      house_number: house.house_number,
      pic: house.pic,
      created_at: house.created_at
        ? Timestamp.fromDate(house.created_at)
        : Timestamp.now(),
    });
  }

  async function deleteHouse(id: string): Promise<void> {
    await deleteDoc(doc(db.value, "houses", id));
  }

  // =====================
  // IPL RECORDS CRUD
  // =====================

  async function getIplRecords(period: string): Promise<IplRecord[]> {
    const snapshot = await getDocs(
      query(
        collection(db.value, "ipl_records"),
        where("period", "==", period),
        orderBy("block"),
        orderBy("house_number"),
      ),
    );
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      updated_at: d.data().updated_at?.toDate?.() || null,
    })) as IplRecord[];
  }

  /**
   * Auto-generate IPL records for a new period.
   */
  async function generateIplRecords(period: string): Promise<IplRecord[]> {
    const houses = await getHouses();
    const previousPeriod = getPreviousPeriod(period);
    const previousRecords = await getIplRecords(previousPeriod);

    const previousMap = new Map<string, IplRecord>();
    previousRecords.forEach((r) => {
      previousMap.set(r.house_id, r);
    });

    return houses.map((house) => {
      const houseId = generateHouseId(house.block, house.house_number);
      const prev = previousMap.get(houseId);

      let prevJenis = prev?.jenis_iuran || "Air & Sampah";

      return {
        period,
        house_id: houseId,
        block: house.block,
        house_number: house.house_number,
        status_rumah: (prev?.status_rumah || "Kosong") as HouseStatus,
        jenis_iuran: prevJenis as DuesType,
        status_iuran: "Belum Terbayarkan" as PaymentStatus,
        water_meter_past: prev?.water_meter_current || 0,
        water_meter_current: 0,
        updated_at: null,
      };
    });
  }

  /**
   * Batch save IPL records using Firestore writeBatch().
   */
  async function batchSaveIplRecords(records: IplRecord[]): Promise<void> {
    const batch = writeBatch(db.value);

    records.forEach((record) => {
      const id = generateIplRecordId(
        record.period,
        record.block,
        record.house_number,
      );
      const ref = doc(db.value, "ipl_records", id);
      batch.set(ref, {
        period: record.period,
        house_id:
          record.house_id || generateHouseId(record.block, record.house_number),
        block: record.block,
        house_number: record.house_number,
        status_rumah: record.status_rumah,
        jenis_iuran: record.jenis_iuran,
        status_iuran: record.status_iuran,
        water_meter_past: record.water_meter_past,
        water_meter_current: record.water_meter_current,
        updated_at: Timestamp.now(),
      });
    });

    await batch.commit();
  }

  // =====================
  // DYNAMIC PRICING ENGINE
  // =====================

  /**
   * Universal function to calculate bill based on dynamic master data
   */
  function calculateIplTotal(record: IplRecord, config: SiteConfig): number {
    const usage = Math.max(
      0,
      record.water_meter_current - record.water_meter_past,
    );
    let total = 0;

    // 1. Biaya Sampah
    if (record.jenis_iuran.includes("Sampah")) {
      total += config.dues_trash_flat || 25000;
    }

    // 2. Biaya Air Progresif
    if (record.jenis_iuran.includes("Air")) {
      const minFee = config.water_min_fee || 25000;
      const pricePerCubic = config.water_price_per_cubic || 3500;

      // Bebas biaya air bulanan jika benar-benar kosong dan nihil pemakaian
      if (record.status_rumah === "Kosong" && usage === 0) {
        // Biaya 0
      } else {
        if (usage <= 10) {
          total += minFee;
        } else {
          total += minFee + (usage - 10) * pricePerCubic;
        }
      }
    }

    return total;
  }

  // =====================
  // DASHBOARD STATS
  // =====================

  function computeStats(
    records: IplRecord[],
    config: SiteConfig,
  ): DashboardStats {
    let totalKasMasuk = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    const occupiedHouses = new Set<string>();

    records.forEach((r) => {
      // Perhitungan menggunakan Engine Harga Dinamis
      if (r.status_iuran === "Terbayarkan") {
        totalKasMasuk += calculateIplTotal(r, config);
        totalPaid++;
      } else {
        totalUnpaid++;
      }

      if (OCCUPIED_STATUSES.includes(r.status_rumah)) {
        occupiedHouses.add(r.house_id);
      }
    });

    return {
      totalKasMasuk,
      totalRumahTerisi: occupiedHouses.size,
      totalPaid,
      totalUnpaid,
    };
  }

  // =====================
  // CONFIG
  // =====================

  async function getSiteConfig(): Promise<SiteConfig> {
    // Note: Pastikan path collection ini sama dengan yang di server/api/config.post.ts
    // Sebaiknya seragamkan, jika API post ke `collection('config').doc('site')`,
    // maka kita sesuaikan pemanggilan frontend-nya:
    const docSnap = await getDoc(doc(db.value, "config", "site"));
    if (docSnap.exists()) {
      return { ...DEFAULT_SITE_CONFIG, ...docSnap.data() } as SiteConfig;
    }
    return DEFAULT_SITE_CONFIG;
  }

  // =====================
  // HELPERS
  // =====================

  function getPreviousPeriod(period: string): string {
    const [year, month] = period.split("-").map(Number);
    const prevDate = new Date(year, month - 2, 1); // month is 0-indexed in JS
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  }

  function generatePeriodOptions(
    count: number = 12,
  ): { label: string; value: string }[] {
    const options: { label: string; value: string }[] = [];
    const now = new Date();
    const months = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    for (let i = -2; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `IPL ${months[d.getMonth()]} ${d.getFullYear()}`;
      options.push({ label, value });
    }

    return options;
  }

  function getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  return {
    getHouses,
    getHouse,
    saveHouse,
    deleteHouse,
    getIplRecords,
    generateIplRecords,
    batchSaveIplRecords,

    // Gunakan ini di komponen agar rumusnya konsisten se-aplikasi
    calculateIplTotal,
    computeStats,

    getSiteConfig,
    getPreviousPeriod,
    generatePeriodOptions,
    getCurrentPeriod,
  };
}
