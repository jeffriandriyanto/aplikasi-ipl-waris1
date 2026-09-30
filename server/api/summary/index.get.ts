import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { House } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = query.period as string

  if (!period) {
    throw createError({ statusCode: 400, statusMessage: 'Period is required' })
  }

  return cachedFetch(`summary:${period}`, CACHE_TTL.SUMMARY, async () => {
    const db = getFirestoreDb()

    // Fetch active houses for filtering
    const houses = await cachedFetch<House[]>(CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
      const snapshot = await db.collection('houses').get()
      const result: House[] = []
      snapshot.forEach(doc => {
        const data = doc.data()
        result.push({
          id: doc.id,
          block: data.block,
          house_number: data.house_number,
          pic: data.pic,
          is_active: data.is_active !== false,
          created_at: null,
        })
      })
      return result
    })

    const activeHouseIds = new Set(houses.filter(h => h.is_active !== false).map(h => h.id))

    const iplSnap = await db.collection('ipl_records')
      .where('period', '==', period)
      .get()

    let totalIuranTerkumpul = 0
    let totalRumahTerbayar = 0
    let totalRumahBelumBayar = 0

    iplSnap.forEach(doc => {
      const data = doc.data()
      // Skip records for inactive houses
      if (!activeHouseIds.has(data.house_id)) return

      totalIuranTerkumpul += data.amount_paid || 0

      if (data.status_iuran === 'Terbayarkan') {
        totalRumahTerbayar++
      } else {
        totalRumahBelumBayar++
      }
    })

    const kasSnap = await db.collection('kas_log')
      .where('period', '==', period)
      .get()

    let totalKasMasukLainnya = 0
    const pengeluaranByCategory: Record<string, number> = {}

    kasSnap.forEach(doc => {
      const data = doc.data()
      if (data.type === 'masuk') {
        totalKasMasukLainnya += data.amount || 0
      } else if (data.type === 'keluar') {
        const cat = data.category || 'Lainnya'
        pengeluaranByCategory[cat] = (pengeluaranByCategory[cat] || 0) + (data.amount || 0)
      }
    })

    const totalPengeluaran = Object.values(pengeluaranByCategory).reduce((a, b) => a + b, 0)
    const saldoAkhir = totalIuranTerkumpul + totalKasMasukLainnya - totalPengeluaran

    return {
      totalIuranTerkumpul,
      totalRumahTerbayar,
      totalRumahBelumBayar,
      totalKasMasukLainnya,
      pengeluaranByCategory,
      totalPengeluaran,
      saldoAkhir,
    }
  })
})
