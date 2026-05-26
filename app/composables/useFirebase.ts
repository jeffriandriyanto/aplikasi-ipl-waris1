import { type Auth } from 'firebase/auth'
import { type Firestore } from 'firebase/firestore'

/**
 * Composable to access Firebase services.
 * Must be called after the firebase.client plugin has initialized.
 */
export function useFirebase() {
  const nuxtApp = useNuxtApp()

  const auth = computed<Auth>(() => nuxtApp.$firebaseAuth as Auth)
  const db = computed<Firestore>(() => nuxtApp.$firebaseDb as Firestore)

  return {
    auth,
    db,
  }
}
