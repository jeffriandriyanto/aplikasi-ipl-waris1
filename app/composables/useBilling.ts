import type { IplRecord, SiteConfig } from '~/types'

export function useBilling() {
  function calculateTotal(r: IplRecord, config: SiteConfig): number {
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

  function usageValue(r: IplRecord): number {
    return Math.max(0, r.water_meter_current - r.water_meter_past)
  }

  function overpayment(r: IplRecord, config: SiteConfig): number {
    const bill = calculateTotal(r, config)
    const paid = r.amount_paid ?? bill
    return paid - bill
  }

  function formatCurrency(n: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n)
  }

  function statusBadge(s: string): string {
    if (s === 'Ditinggali') return 'badge-occupied'
    if (s === 'Disewakan') return 'badge-rented'
    return 'badge-vacant'
  }

  function normalizeHouseNumber(input: string): string {
    return input.toLowerCase().replace(/\s+/g, '').trim()
  }

  function matchHouseNumber(houseNumber: string, search: string): boolean {
    const hn = normalizeHouseNumber(houseNumber)
    const q = normalizeHouseNumber(search)

    if (hn === q) return true

    const tokens = hn.split(/[&,/\-]+|(?:dan)/).map(t => t.trim()).filter(Boolean)
    return tokens.some(token => token === q)
  }

  function sanitizeCsvField(value: string | number): string {
    const str = String(value)
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str.replace(/"/g, '""')}`
    }
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  return {
    calculateTotal,
    usageValue,
    overpayment,
    formatCurrency,
    statusBadge,
    matchHouseNumber,
    sanitizeCsvField,
  }
}
