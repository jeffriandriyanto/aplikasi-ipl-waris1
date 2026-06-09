import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { KasLogEntry } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const period = query.period as string

  if (!period) {
    throw createError({ statusCode: 400, statusMessage: 'Period is required' })
  }

  return cachedFetch(CACHE_KEYS.kasEntries(period), CACHE_TTL.KAS_ENTRIES, async () => {
    const db = getFirestoreDb()
    const snapshot = await db.collection('kas_log')
      .where('period', '==', period)
      .get()

    const entries: KasLogEntry[] = []
    snapshot.forEach(doc => {
      const data = doc.data()
      entries.push({
        id: doc.id,
        period: data.period,
        type: data.type,
        category: data.category,
        description: data.description,
        amount: data.amount,
        created_at: data.created_at ? data.created_at.toDate() : null,
      })
    })

    entries.sort((a, b) => {
      const dateA = a.created_at ? a.created_at.getTime() : 0
      const dateB = b.created_at ? b.created_at.getTime() : 0
      return dateB - dateA
    })

    return entries
  })
})
