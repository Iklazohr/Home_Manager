import { useState, useCallback } from 'react'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { app, db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

export function useNotifications() {
  const { user, userProfile, updateProfileData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const enableNotifications = useCallback(async () => {
    if (!user) return false
    setLoading(true)
    setError('')

    try {
      // Verifica supporto browser
      const supported = await isSupported()
      if (!supported) {
        setError('Il tuo browser non supporta le notifiche push.')
        return false
      }

      // Richiedi permesso
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Permesso notifiche negato.')
        return false
      }

      // Registra il service worker per FCM
      const swRegistration = await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
        { scope: '/' }
      )

      // Invia la config Firebase al SW
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      }

      if (swRegistration.active) {
        swRegistration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: firebaseConfig,
        })
      }

      // Ottieni token FCM
      const messaging = getMessaging(app)
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      })

      if (!token) {
        setError('Impossibile ottenere il token per le notifiche.')
        return false
      }

      // Salva token nel profilo utente
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: token,
        notificationsEnabled: true,
      })
      updateProfileData({ fcmToken: token, notificationsEnabled: true })

      return true
    } catch (err) {
      console.error('Errore abilitazione notifiche:', err)
      setError('Errore nell\'attivazione delle notifiche.')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, updateProfileData])

  const disableNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fcmToken: null,
        notificationsEnabled: false,
      })
      updateProfileData({ fcmToken: null, notificationsEnabled: false })
    } catch (err) {
      console.error('Errore disabilitazione notifiche:', err)
    } finally {
      setLoading(false)
    }
  }, [user, updateProfileData])

  return {
    isEnabled: userProfile?.notificationsEnabled ?? false,
    hasFcmToken: !!userProfile?.fcmToken,
    loading,
    error,
    enableNotifications,
    disableNotifications,
  }
}
