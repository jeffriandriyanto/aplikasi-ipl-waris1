import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "~/types";

/**
 * Auth composable with Firebase Authentication + Firestore user profile.
 * Manages the current user state reactively.
 */
export function useAuth() {
  const { auth, db } = useFirebase();

  const currentUser = useState<FirebaseUser | null>("auth-user", () => null);
  const userProfile = useState<User | null>("user-profile", () => null);
  const isLoading = useState<boolean>("auth-loading", () => true);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => userProfile.value?.role === "admin");
  const isPetugas = computed(() => userProfile.value?.role === "petugas");

  /**
   * Fetch user profile from Firestore `users` collection
   */
  async function fetchUserProfile(uid: string): Promise<void> {
    try {
      console.log("--- FETCHING USER PROFILE ---");
      console.log("UID Target:", uid);

      const userRef = doc(db.value, "users", uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log("Data Ditemukan di Firestore:", data);

        // Memaksa pengambilan nilai dari Firestore ke state Vue
        userProfile.value = {
          email: data.email || currentUser.value?.email || "",
          name: data.name || currentUser.value?.displayName || "User",
          role: data.role || "petugas", // Ambil role dari Firestore
        };
      } else {
        console.warn("Dokumen tidak ditemukan di Firestore untuk UID:", uid);
        // Auto-create a minimal profile if not found
        userProfile.value = {
          email: currentUser.value?.email || "",
          name: currentUser.value?.displayName || "User",
          role: "petugas",
        };
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
      userProfile.value = null;
    }
  }

  /**
   * Initialize auth state listener
   */
  function initAuth(): void {
    onAuthStateChanged(auth.value, async (user) => {
      currentUser.value = user;
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        userProfile.value = null;
      }
      isLoading.value = false;
    });
  }

  /**
   * Sign in with email and password
   */
  async function signIn(email: string, password: string): Promise<boolean> {
    error.value = null;
    isLoading.value = true;
    try {
      const credential = await signInWithEmailAndPassword(
        auth.value,
        email,
        password,
      );
      currentUser.value = credential.user;
      await fetchUserProfile(credential.user.uid);
      isLoading.value = false;
      return true;
    } catch (e: any) {
      isLoading.value = false;
      const code = e?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        error.value = "Email atau password salah.";
      } else if (code === "auth/too-many-requests") {
        error.value = "Terlalu banyak percobaan login. Coba lagi nanti.";
      } else {
        error.value = "Terjadi kesalahan. Silakan coba lagi.";
      }
      return false;
    }
  }

  /**
   * Sign out
   */
  async function signOut(): Promise<void> {
    await firebaseSignOut(auth.value);
    currentUser.value = null;
    userProfile.value = null;
    navigateTo("/login");
  }

  return {
    currentUser,
    userProfile,
    isLoading,
    isAuthenticated,
    isAdmin,
    isPetugas,
    error,
    initAuth,
    signIn,
    signOut,
  };
}
