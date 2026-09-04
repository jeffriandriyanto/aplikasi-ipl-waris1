import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { HouseLedgerEntry, SiteConfig } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const houseId = query.house_id as string

  if (!houseId) {
    throw createError({ statusCode: 400, statusMessage: 'house_id is required' })
  }

  return cachedFetch(CACHE_KEYS.houseLedger(houseId), CACHE_TTL.LEDGER, async () => {
    const db = getFirestoreDb()

    // Fetch site config from cache
    const config = await cachedFetch<SiteConfig>(CACHE_KEYS.CONFIG, CACHE_TTL.CONFIG, async () => {
      const configDoc = await db.collection('config').doc('site').get()
      return configDoc.exists ? configDoc.data() as SiteConfig : {
        dues_trash_flat: 25000,
        water_min_fee: 25000,
        water_price_per_cubic: 3500,
      }
    })

    // Fetch all records for this house, ordered by period
    const snapshot = await db.collection('ipl_records')
      .where('house_id', '==', houseId)
      .get()

    if (snapshot.empty) {
      return { entries: [], house_id: houseId, house: null }
    }

    const entries: HouseLedgerEntry[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      entries.push({
        period: data.period,
        tagihan: data.saldo_akhir != null && data.saldo_awal != null
          ? (data.saldo_awal + (data.amount_paid ?? 0) - data.saldo_akhir)
          : 0,
        amount_paid: data.amount_paid ?? 0,
        saldo_awal: data.saldo_awal ?? 0,
        saldo_akhir: data.saldo_akhir ?? 0,
        status_iuran: data.status_iuran,
      })
    })

    // Sort by period
    entries.sort((a, b) => a.period.localeCompare(b.period))

    // Get house info from cache
    const houses = await cachedFetch<{ id: string; block: string; house_number: string; pic: string }[]>(
      CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
        const snapshot = await db.collection('houses').get()
        const result: { id: string; block: string; house_number: string; pic: string }[] = []
        snapshot.forEach(doc => {
          const data = doc.data()
          result.push({
            id: doc.id,
            block: data.block,
            house_number: data.house_number,
            pic: data.pic,
          })
        })
        return result
      }
    )

    const houseInfo = houses.find(h => h.id === houseId) || null

    return { entries, house_id: houseId, house: houseInfo }
  })
})
