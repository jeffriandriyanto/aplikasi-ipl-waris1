import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import { DEFAULT_SITE_CONFIG } from '~/types'

export default defineEventHandler(async () => {
  return cachedFetch(CACHE_KEYS.CONFIG, CACHE_TTL.CONFIG, async () => {
    const db = getFirestoreDb()
    const docSnap = await db.collection('config').doc('site').get()
    
    if (docSnap.exists) {
      return { ...DEFAULT_SITE_CONFIG, ...docSnap.data() }
    }
    return DEFAULT_SITE_CONFIG
  })
})
