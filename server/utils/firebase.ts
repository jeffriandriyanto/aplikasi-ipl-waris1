import admin from 'firebase-admin'

let initialized = false

export function getFirebaseAdmin() {
  if (!initialized) {
    const config = useRuntimeConfig()
    
    try {
      const serviceAccountParams = config.firebaseServiceAccount 
        ? JSON.parse(config.firebaseServiceAccount)
        : {}

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountParams),
      })
      initialized = true
    } catch (error) {
      console.warn('Firebase Admin init warning:', error)
      // Fallback for default initialization if deployed in GCP
      if (!admin.apps.length) {
         admin.initializeApp()
         initialized = true
      }
    }
  }
  return admin
}

export function getFirestoreDb() {
  return getFirebaseAdmin().firestore()
}
