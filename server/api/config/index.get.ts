import { getFirestoreDb } from '../../utils/firebase'
import { DEFAULT_SITE_CONFIG } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const db = getFirestoreDb()
    const docSnap = await db.collection('config').doc('site').get()
    
    if (docSnap.exists) {
      return { ...DEFAULT_SITE_CONFIG, ...docSnap.data() }
    }
    return DEFAULT_SITE_CONFIG
  } catch (error) {
    console.error('Error fetching site config from admin SDK:', error)
    return DEFAULT_SITE_CONFIG
  }
})
