// TypeScript types for the IPL Management System

export interface User {
  email: string
  name: string
  role: 'admin' | 'petugas'
}

export interface House {
  id?: string
  block: string
  house_number: string
  pic: string
  is_active?: boolean
  created_at: Date | null
}

export type HouseStatus = 'Ditinggali' | 'Disewakan' | 'Kosong' | ''
// Hapus 'Hanya Sampah' karena air sekarang mandatory
export type DuesType = 'Air & Sampah' | 'Air' 
export type PaymentStatus = 'Terbayarkan' | 'Belum Terbayarkan'

export interface IplRecord {
  id?: string
  period: string // YYYY-MM
  house_id: string
  block: string
  house_number: string
  status_rumah: HouseStatus
  jenis_iuran: DuesType
  status_iuran: PaymentStatus
  water_meter_past: number
  water_meter_current: number
  amount_paid?: number
  saldo_awal?: number    // Carry-over dari bulan sebelumnya (+ kredit, - utang)
  saldo_akhir?: number   // saldo_awal + amount_paid - tagihan
  updated_at: Date | null
}

export interface PeriodOption {
  label: string
  value: string // YYYY-MM
}

export interface DashboardStats {
  totalKasMasuk: number
  totalRumahTerisi: number
  totalPaid: number
  totalUnpaid: number
}

// Firestore document ID generation helpers
export function generateHouseId(block: string, houseNumber: string): string {
  return `${block.toLowerCase().replace(/\s+/g, '_')}_${houseNumber.toLowerCase().replace(/\s+/g, '_')}`
}

export function generateIplRecordId(period: string, block: string, houseNumber: string): string {
  return `${period}_${generateHouseId(block, houseNumber)}`
}

// Opsi dropdown (Hanya Sampah dihapus dari DUES_TYPE_OPTIONS)
export const HOUSE_STATUS_OPTIONS: HouseStatus[] = ['', 'Ditinggali', 'Disewakan', 'Kosong']
export const DUES_TYPE_OPTIONS: DuesType[] = ['Air & Sampah', 'Air']
export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['Terbayarkan', 'Belum Terbayarkan']

// Occupied statuses that count toward "Total Rumah Terisi"
export const OCCUPIED_STATUSES: HouseStatus[] = ['Ditinggali', 'Disewakan']

// Master Data (Diubah sesuai kebutuhan baru: flat sampah, min air, dan tarif per kubik ekstra)
export interface SiteConfig {
  dues_trash_flat: number         // Biaya sampah flat (ex: 25000)
  water_min_fee: number           // Biaya minimal air untuk <= 10m³ (ex: 25000)
  water_price_per_cubic: number   // Biaya per kubik jika pemakaian > 10m³
}

// Default config if DB is empty
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  dues_trash_flat: 25000,
  water_min_fee: 25000,
  water_price_per_cubic: 3500,
}

export interface HouseLedgerEntry {
  period: string
  tagihan: number
  amount_paid: number
  saldo_awal: number
  saldo_akhir: number
  status_iuran: PaymentStatus
}

export type KasType = 'masuk' | 'keluar'

export interface KasLogEntry {
  id?: string
  period: string
  type: KasType
  category: string
  description: string
  amount: number
  transaction_date?: Date | null
  created_at: Date | null
}

export const KAS_CATEGORIES: Record<KasType, string[]> = {
  masuk: ['Donasi', 'Iuran Tambahan', 'Sumbangan', 'Lainnya'],
  keluar: ['Perbaikan', 'Operasional', 'Infrastruktur', 'Kebersihan', 'Lainnya'],
}
