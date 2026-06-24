import { getFirestoreDb } from '../../utils/firebase'
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '../../utils/cache'
import type { House } from '~/types'

export default defineEventHandler(async () => {
  return cachedFetch(CACHE_KEYS.HOUSES, CACHE_TTL.HOUSES, async () => {
    const db = getFirestoreDb()
    const snapshot = await db.collection('houses').get()
    
    const houses: House[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      
      // Normalisasi created_at agar adaptif terhadap tipe Timestamp maupun String ISO
      let formattedDate = null
      if (data.created_at) {
        if (typeof data.created_at.toDate === 'function') {
          // Jika bertipe asli Firestore Timestamp
          formattedDate = data.created_at.toDate().toISOString()
        } else {
          // Jika bertipe String ISO (hasil dari script bulk import kita)
          formattedDate = new Date(data.created_at).toISOString()
        }
      }

      houses.push({
        id: doc.id,
        block: data.block,
        house_number: data.house_number,
        pic: data.pic,
        is_active: data.is_active !== false,
        created_at: formattedDate,
      })
    })
    
    houses.sort((a, b) => {
      if (a.block === b.block) {
        return a.house_number.localeCompare(b.house_number, undefined, { numeric: true })
      }
      return a.block.localeCompare(b.block)
    })

    return houses
  })
})