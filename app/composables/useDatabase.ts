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

export function useDatabase() {
  const { db } = useFirebase();
  const { calculateTotal } = useBilling();

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

  function computeStats(
    records: IplRecord[],
    config: SiteConfig,
  ): DashboardStats {
    let totalKasMasuk = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    const occupiedHouses = new Set<string>();

    records.forEach((r) => {
      if (r.status_iuran === "Terbayarkan") {
        totalKasMasuk += calculateTotal(r, config);
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

  async function getSiteConfig(): Promise<SiteConfig> {
    try {
      const config = await $fetch<SiteConfig>("/api/config");
      return config;
    } catch (e) {
      console.warn("Failed to fetch site config from API", e);
      return DEFAULT_SITE_CONFIG;
    }
  }

  function getPreviousPeriod(period: string): string {
    const [year, month] = period.split('-').map(Number)
    const prevDate = new Date(year!, (month || 1) - 2, 1)
    return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
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

    computeStats,

    getSiteConfig,
    getPreviousPeriod,
    generatePeriodOptions,
    getCurrentPeriod,
  };
}
