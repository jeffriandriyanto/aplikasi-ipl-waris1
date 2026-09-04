import { getFirestoreDb } from '../../utils/firebase'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const block = (query.block as string || '').trim()
  const houseNumber = (query.house_number as string || '').trim()

  if (!block || !houseNumber) {
    throw createError({ statusCode: 400, statusMessage: 'block and house_number are required' })
  }

  const db = getFirestoreDb()

  const snapshot = await db.collection('ipl_records')
    .where('block', '==', block)
    .get()

  if (snapshot.empty) {
    return { records: [] }
  }

  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').trim()
  const targetNorm = normalize(houseNumber)

  const records: any[] = []
  snapshot.forEach(doc => {
    const data = doc.data()
    const hn = normalize(data.house_number || '')
    if (hn !== targetNorm) return

    const saldoAwal = data.saldo_awal ?? 0
    const amountPaid = data.amount_paid ?? 0
    const saldoAkhir = data.saldo_akhir ?? 0

    records.push({
      period: data.period,
      water_meter_past: data.water_meter_past ?? 0,
      water_meter_current: data.water_meter_current ?? 0,
      amount_paid: amountPaid,
      saldo_awal: saldoAwal,
      saldo_akhir: saldoAkhir,
      status_iuran: data.status_iuran,
      tagihan: saldoAwal + amountPaid - saldoAkhir,
    })
  })

  records.sort((a, b) => a.period.localeCompare(b.period))

  return { records }
})
