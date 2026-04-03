import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserProfile } from '@/types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  addHouseholdId: (householdId: string) => void
  updateProfileData: (updates: Partial<Omit<UserProfile, 'uid'>>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Crea il profilo Firestore se mancante (es. registrazione parzialmente fallita)
  async function ensureProfile(firebaseUser: User): Promise<UserProfile> {
    const docRef = doc(db, 'users', firebaseUser.uid)
    const profile: Omit<UserProfile, 'uid'> = {
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Utente',
      avatarUrl: null,
      householdIds: [],
      notificationsEnabled: true,
      fcmToken: null,
      createdAt: serverTimestamp() as UserProfile['createdAt'],
    }
    await setDoc(docRef, profile)
    return { uid: firebaseUser.uid, ...profile }
  }

  async function fetchProfile(firebaseUser: User) {
    // Retry: Firestore potrebbe non essere ancora connesso al primo tentativo
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const docRef = doc(db, 'users', firebaseUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setUserProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile)
        } else {
          const profile = await ensureProfile(firebaseUser)
          setUserProfile(profile)
        }
        return
      } catch (err) {
        console.warn(`Tentativo ${attempt + 1}/3 caricamento profilo fallito:`, err)
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        } else {
          console.error('Errore caricamento profilo dopo 3 tentativi:', err)
        }
      }
    }
  }

  useEffect(() => {
    // Safety timeout: se onAuthStateChanged non scatta entro 5s, sblocca l'app
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout)
      try {
        setUser(firebaseUser)
        if (firebaseUser) {
          await fetchProfile(firebaseUser)
        } else {
          setUserProfile(null)
        }
      } catch (err) {
        console.error('Errore auth state change:', err)
      } finally {
        setLoading(false)
      }
    })
    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await fetchProfile(cred.user)
  }

  async function register(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })

    const profile: Omit<UserProfile, 'uid'> = {
      email,
      displayName,
      avatarUrl: null,
      householdIds: [],
      notificationsEnabled: true,
      fcmToken: null,
      createdAt: serverTimestamp() as UserProfile['createdAt'],
    }

    await setDoc(doc(db, 'users', cred.user.uid), profile)
    setUserProfile({ uid: cred.user.uid, ...profile })
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setUserProfile(null)
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user)
    }
  }

  function addHouseholdId(householdId: string) {
    setUserProfile((prev) =>
      prev ? { ...prev, householdIds: [...prev.householdIds, householdId] } : null
    )
  }

  function updateProfileData(updates: Partial<Omit<UserProfile, 'uid'>>) {
    setUserProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        addHouseholdId,
        updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider')
  }
  return context
}
