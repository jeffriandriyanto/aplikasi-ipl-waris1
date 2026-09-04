import type { SiteConfig } from '~/types'

interface BillRecord {
  status_rumah: string
  jenis_iuran: string
  water_meter_past: number
  water_meter_current: number
  amount_paid?: number
  saldo_awal?: number
}

export function calculateTotal(r: BillRecord, config: SiteConfig): number {
  // Rumah Kosong atau belum diset tidak ada tagihan
  if (r.status_rumah === 'Kosong' || r.status_rumah === '') return 0

  const usage = Math.max(0, r.water_meter_current - r.water_meter_past)
  let total = 0

  if (r.jenis_iuran.includes('Sampah')) {
    total += config.dues_trash_flat || 25000
  }

  if (r.jenis_iuran.includes('Air')) {
    const minFee = config.water_min_fee || 25000
    const pricePerCubic = config.water_price_per_cubic || 3500

    if (r.status_rumah === 'Kosong' && usage === 0) {
      // No water fee for vacant houses with zero usage
    } else {
      if (usage <= 10) {
        total += minFee
      } else {
        total += minFee + (usage - 10) * pricePerCubic
      }
    }
  }

  return total
}

export function closingBalance(r: BillRecord, config: SiteConfig): number {
  const bill = calculateTotal(r, config)
  const saldoAwal = r.saldo_awal ?? 0
  const paid = r.amount_paid ?? 0
  return saldoAwal + paid - bill
}
