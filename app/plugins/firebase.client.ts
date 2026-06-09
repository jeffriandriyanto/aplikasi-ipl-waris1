import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore } from 'firebase/firestore'

let firebaseApp: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  }

  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig)
    auth = getAuth(firebaseApp)
    db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  }

  return {
    provide: {
      firebaseApp,
      firebaseAuth: auth,
      firebaseDb: db,
    },
  }
})
