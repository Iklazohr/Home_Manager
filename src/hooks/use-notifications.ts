import { useEffect, useState, useCallback, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import { useChores } from '@/hooks/use-chores'
import type { Timestamp } from 'firebase/firestore'

const CHECK_INTERVAL = 60 * 60 * 1000 // Controlla ogni ora
const NOTIFICATION_KEY = 'hm_last_notification'

// Payload notifica condiviso con il layer nativo (branch Android)
interface NotificationPayload {
  title: string
  body: string
  tag?: string
}

// Bridge opzionale che il branch Android popola per delegare la consegna
// delle notifiche al plugin nativo (@capacitor/local-notifications).
// Su web questo resta undefined e si usa la Web Notifications API.
type NativeBridge = {
  isNative?: boolean
  deliver?: (payload: NotificationPayload) => void | Promise<void>
  requestPermission?: () => Promise<boolean>
}

function getNativeBridge(): NativeBridge | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    __hmNotifications?: NativeBridge
    Capacitor?: { isNativePlatform?: () => boolean }
  }
  if (w.__hmNotifications) return w.__hmNotifications
  // Fallback: rileva Capacitor senza importarlo
  if (w.Capacitor?.isNativePlatform?.()) return { isNative: true }
  return undefined
}

export function useNotifications() {
  const { user, userProfile, updateProfileData } = useAuth()
  const { chores } = useChores()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isEnabled = userProfile?.notificationsEnabled ?? false
  const native = getNativeBridge()
  const isNative = !!native?.isNative
  const hasWebNotifications = typeof window !== 'undefined' && 'Notification' in window
  // Su nativo consideriamo comunque supportato: il branch Android fornisce il plugin
  const isSupported = isNative || hasWebNotifications

  // Consegna effettiva della notifica: delega al nativo se presente,
  // altrimenti usa la Web Notifications API
  const deliver = useCallback((payload: NotificationPayload) => {
    if (native?.deliver) {
      try {
        void native.deliver(payload)
      } catch (err) {
        console.warn('Errore consegna notifica nativa:', err)
      }
      return
    }
    if (hasWebNotifications && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.svg',
        tag: payload.tag ?? 'chore-reminder',
      })
    }
  }, [native, hasWebNotifications])

  // Controlla scadenze e mostra notifica locale
  const checkAndNotify = useCallback(() => {
    if (!isEnabled) return
    // Su web e necessario il permesso; su nativo lo gestisce il plugin
    if (!isNative && (!hasWebNotifications || Notification.permission !== 'granted')) return

    const now = new Date()
    const lastNotif = localStorage.getItem(NOTIFICATION_KEY)
    const lastNotifTime = lastNotif ? parseInt(lastNotif, 10) : 0

    // Non notificare piu di una volta ogni 4 ore
    if (now.getTime() - lastNotifTime < 4 * 60 * 60 * 1000) return

    const dueChores = chores.filter((c) => {
      if (c.status === 'completato') return false
      const due = (c.nextDueDate as Timestamp).toDate()
      // In scadenza entro 24h o gia in ritardo
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      return due <= in24h
    }).filter((c) => {
      // Solo attivita assegnate a me o a tutti
      return c.assignedTo === user?.uid || c.assignedTo === 'everyone'
    })

    if (dueChores.length === 0) return

    const overdue = dueChores.filter(
      (c) => (c.nextDueDate as Timestamp).toDate() < now
    )

    const title = overdue.length > 0
      ? `${overdue.length} attivita in ritardo!`
      : `${dueChores.length} attivita in scadenza`

    const body = dueChores
      .slice(0, 3)
      .map((c) => c.choreTypeName)
      .join(', ')
      + (dueChores.length > 3 ? ` e altre ${dueChores.length - 3}` : '')

    deliver({ title, body, tag: 'chore-reminder' })

    localStorage.setItem(NOTIFICATION_KEY, now.getTime().toString())
  }, [chores, isEnabled, isNative, hasWebNotifications, user?.uid, deliver])

  // Avvia/ferma il check periodico
  useEffect(() => {
    if (!isSupported || !isEnabled) return

    const permissionOk = isNative || (hasWebNotifications && Notification.permission === 'granted')
    if (!permissionOk) return

    checkAndNotify()
    intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isSupported, isEnabled, isNative, hasWebNotifications, checkAndNotify])

  const enableNotifications = useCallback(async () => {
    if (!user || !isSupported) {
      setError('Il tuo dispositivo non supporta le notifiche.')
      return false
    }

    setLoading(true)
    setError('')

    try {
      // Su nativo: delega la richiesta di permesso al plugin, se fornito
      if (isNative) {
        if (native?.requestPermission) {
          const granted = await native.requestPermission()
          if (!granted) {
            setError('Permesso notifiche negato. Controlla le impostazioni dell\'app.')
            return false
          }
        }
        // Se il bridge nativo non espone requestPermission assumiamo ok:
        // il plugin Android si occupera del permesso al primo invio.
      } else {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setError('Permesso notifiche negato. Controlla le impostazioni del browser.')
          return false
        }
      }

      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: true,
      })
      updateProfileData({ notificationsEnabled: true })
      return true
    } catch (err) {
      console.error('Errore abilitazione notifiche:', err)
      setError('Errore nell\'attivazione delle notifiche.')
      return false
    } finally {
      setLoading(false)
    }
  }, [user, isSupported, isNative, native, updateProfileData])

  const disableNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationsEnabled: false,
      })
      updateProfileData({ notificationsEnabled: false })
    } catch (err) {
      console.error('Errore disabilitazione notifiche:', err)
    } finally {
      setLoading(false)
    }
  }, [user, updateProfileData])

  return {
    isEnabled,
    isSupported,
    loading,
    error,
    enableNotifications,
    disableNotifications,
  }
}
