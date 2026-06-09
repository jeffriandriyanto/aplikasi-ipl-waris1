import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import type { User } from "~/types";

export function useAuth() {
  const { auth, db } = useFirebase();

  const currentUser = useState<FirebaseUser | null>("auth-user", () => null);
  const userProfile = useState<User | null>("user-profile", () => null);
  const isLoading = useState<boolean>("auth-loading", () => true);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!currentUser.value);
  const isAdmin = computed(() => userProfile.value?.role === "admin");
  const isPetugas = computed(() => userProfile.value?.role === "petugas");

  async function fetchUserProfile(uid: string): Promise<void> {
    try {
      const userRef = doc(db.value, "users", uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        userProfile.value = {
          email: data.email || currentUser.value?.email || "",
          name: data.name || currentUser.value?.displayName || "User",
          role: data.role || "petugas",
        };
      } else {
        userProfile.value = {
          email: currentUser.value?.email || "",
          name: currentUser.value?.displayName || "User",
          role: "petugas",
        };
      }
    } catch {
      userProfile.value = null;
    }
  }

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

  async function getIdToken(): Promise<string | null> {
    const user = auth.value.currentUser
    if (!user) return null
    try {
      return await user.getIdToken()
    } catch {
      return null
    }
  }

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

  async function signOut(): Promise<void> {
    await firebaseSignOut(auth.value);
    currentUser.value = null;
    userProfile.value = null;
    navigateTo("/admin-login");
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
    getIdToken,
    signIn,
    signOut,
  };
}
