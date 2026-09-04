import * as XLSX from 'xlsx'
import type { IplRecord, HouseStatus, DuesType, PaymentStatus, SiteConfig } from '~/types'

export interface ImportError {
  row: number
  field: string
  message: string
}

export interface ImportPreview {
  records: IplRecord[]
  errors: ImportError[]
  warnings: ImportError[]
  validCount: number
  errorCount: number
}

const HEADERS = [
  'Blok',
  'No. Rumah',
  'Status Rumah',
  'Jenis Iuran',
  'Status Iuran',
  'Meter Lalu',
  'Meter Skrg',
  'Tagihan',
  'Saldo Awal',
  'Bayar (Rp)',
  'Saldo Akhir',
]

const REQUIRED_HEADERS = ['Blok', 'No. Rumah']

export function useExcel() {
  function exportToExcel(records: IplRecord[], period: string, config?: SiteConfig) {
    const { calculateTotal } = useBilling()

    const rows = records.map((r) => [
      r.block,
      r.house_number,
      r.status_rumah,
      r.jenis_iuran,
      r.status_iuran,
      r.water_meter_past,
      r.water_meter_current,
      config ? calculateTotal(r, config) : 0,
      r.saldo_awal ?? 0,
      r.amount_paid ?? 0,
      r.saldo_akhir ?? 0,
    ])

    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows])

    ws['!cols'] = [
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, `IPL ${period}`)

    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `ipl-${period}-${timestamp}.xlsx`)
  }

  async function parseImportFile(
    file: File,
    period: string,
  ): Promise<ImportPreview> {
    const errors: ImportError[] = []
    const warnings: ImportError[] = []
    const records: IplRecord[] = []

    const data = await file.arrayBuffer()
    const wb = XLSX.read(data, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]!]!
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws)

    if (json.length === 0) {
      errors.push({ row: 0, field: 'file', message: 'File kosong' })
      return { records, errors, warnings, validCount: 0, errorCount: 1 }
    }

    const fileHeaders = Object.keys(json[0]!)
    const missingHeaders = REQUIRED_HEADERS.filter((h) => !fileHeaders.includes(h))
    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        field: 'header',
        message: `Kolom wajib hilang: ${missingHeaders.join(', ')}`,
      })
      return { records, errors, warnings, validCount: 0, errorCount: 1 }
    }

    json.forEach((row, idx) => {
      const rowNum = idx + 2
      const block = String(row['Blok'] ?? '').trim()
      const houseNumber = String(row['No. Rumah'] ?? '').trim()

      if (!block || !houseNumber) {
        errors.push({ row: rowNum, field: 'Blok+No', message: 'Blok dan No. Rumah wajib diisi' })
        return
      }

      const statusRumah = String(row['Status Rumah'] ?? '').trim() as HouseStatus
      const jenisIuran = String(row['Jenis Iuran'] ?? 'Air & Sampah').trim() as DuesType
      const statusIuran = String(row['Status Iuran'] ?? 'Belum Terbayarkan').trim() as PaymentStatus
      const meterPast = Number(row['Meter Lalu']) || 0
      const meterCurrent = Number(row['Meter Skrg']) || 0
      const amountPaid = Number(row['Bayar (Rp)']) || 0

      const houseId = `${block.toLowerCase().replace(/\s+/g, '_')}_${houseNumber.toLowerCase().replace(/\s+/g, '_')}`

      records.push({
        period,
        house_id: houseId,
        block,
        house_number: houseNumber,
        status_rumah: statusRumah,
        jenis_iuran: jenisIuran,
        status_iuran: statusIuran,
        water_meter_past: Math.max(0, Math.round(meterPast)),
        water_meter_current: Math.max(0, Math.round(meterCurrent)),
        amount_paid: Math.max(0, Math.round(amountPaid)),
        updated_at: null,
      })
    })

    return {
      records,
      errors,
      warnings,
      validCount: records.length,
      errorCount: errors.length,
    }
  }

  return {
    exportToExcel,
    parseImportFile,
  }
}
