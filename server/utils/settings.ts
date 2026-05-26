import { getFirestoreDb } from './firebase'
import { type SiteConfig, DEFAULT_SITE_CONFIG } from '~/types'

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const db = getFirestoreDb()
    const docSnap = await db.collection('settings').doc('site_config').get()
    
    if (docSnap.exists) {
      return { ...DEFAULT_SITE_CONFIG, ...docSnap.data() } as SiteConfig
    }
    
    // Auto-create default config document if it doesn't exist
    await db.collection('settings').doc('site_config').set(DEFAULT_SITE_CONFIG)
  } catch (e) {
    console.error('Error fetching site_config from Firestore:', e)
  }
  return DEFAULT_SITE_CONFIG
}
