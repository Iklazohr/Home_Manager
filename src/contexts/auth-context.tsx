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
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(uid: string) {
    try {
      const docRef = doc(db, 'users', uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        setUserProfile({ uid, ...docSnap.data() } as UserProfile)
      } else {
        console.warn('Profilo utente non trovato per uid:', uid)
        setUserProfile(null)
      }
    } catch (err) {
      console.error('Errore caricamento profilo:', err)
      setUserProfile(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser)
        if (firebaseUser) {
          await fetchProfile(firebaseUser.uid)
        } else {
          setUserProfile(null)
        }
      } catch (err) {
        console.error('Errore auth state change:', err)
        setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await fetchProfile(cred.user.uid)
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
      await fetchProfile(user.uid)
    }
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout, refreshProfile }}>
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
