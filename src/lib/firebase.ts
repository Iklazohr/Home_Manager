import { initializeApp } from 'firebase/app'
import {
  initializeAuth,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  getAuth,
  type Auth,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Persistenza esplicita: IndexedDB (primario) + localStorage (fallback)
// initializeAuth garantisce che la persistenza sia impostata PRIMA di qualsiasi operazione auth
let auth: Auth
try {
  auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  })
} catch {
  // In caso di HMR (dev) o doppia inizializzazione, usa l'istanza esistente
  auth = getAuth(app)
}

export { auth }
