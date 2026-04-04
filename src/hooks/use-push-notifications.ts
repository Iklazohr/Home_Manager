import { useEffect, useCallback, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isNativePlatform } from '@/lib/capacitor'
import { useAuth } from '@/contexts/auth-context'

export function usePushNotifications() {
  const { user, userProfile, updateProfileData } = useAuth()
  const registeredRef = useRef(false)

  const registerPush = useCallback(async () => {
    if (!isNativePlatform || !user || registeredRef.current) return

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')

      // Controlla permessi
      let permStatus = await PushNotifications.checkPermissions()

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions()
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Permesso notifiche push negato')
        return
      }

      // Listener per il token FCM
      PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Token:', token.value)

        // Salva il token nel profilo utente su Firestore
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: token.value,
          })
          updateProfileData({ fcmToken: token.value })
        }
      })

      // Errore registrazione
      PushNotifications.addListener('registrationError', (err) => {
        console.error('Errore registrazione push:', err)
      })

      // Notifica ricevuta in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Notifica ricevuta:', notification)
      })

      // Utente ha toccato la notifica
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Azione notifica:', action)
      })

      // Registra per push
      await PushNotifications.register()
      registeredRef.current = true
    } catch (err) {
      console.error('Errore setup push notifications:', err)
    }
  }, [user, updateProfileData])

  // Registra automaticamente quando l'utente è loggato e le notifiche sono abilitate
  useEffect(() => {
    if (isNativePlatform && user && userProfile?.notificationsEnabled) {
      registerPush()
    }
  }, [user, userProfile?.notificationsEnabled, registerPush])

  // Cleanup listeners al unmount
  useEffect(() => {
    return () => {
      if (isNativePlatform && registeredRef.current) {
        import('@capacitor/push-notifications').then(({ PushNotifications }) => {
          PushNotifications.removeAllListeners()
        })
      }
    }
  }, [])

  return { registerPush }
}
