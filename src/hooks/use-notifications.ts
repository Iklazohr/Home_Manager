import { useEffect, useState, useCallback, useRef } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import { useChores } from '@/hooks/use-chores'
import type { Timestamp } from 'firebase/firestore'

const CHECK_INTERVAL = 60 * 60 * 1000 // Controlla ogni ora
const NOTIFICATION_KEY = 'hm_last_notification'

export function useNotifications() {
  const { user, userProfile, updateProfileData } = useAuth()
  const { chores } = useChores()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isEnabled = userProfile?.notificationsEnabled ?? false
  const isSupported = typeof window !== 'undefined' && 'Notification' in window

  // Controlla scadenze e mostra notifica locale
  const checkAndNotify = useCallback(() => {
    if (!isEnabled || Notification.permission !== 'granted') return

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

    new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'chore-reminder',
    })

    localStorage.setItem(NOTIFICATION_KEY, now.getTime().toString())
  }, [chores, isEnabled, user?.uid])

  // Avvia/ferma il check periodico
  useEffect(() => {
    if (isEnabled && Notification.permission === 'granted') {
      // Check immediato
      checkAndNotify()
      // Check periodico
      intervalRef.current = setInterval(checkAndNotify, CHECK_INTERVAL)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isEnabled, checkAndNotify])

  const enableNotifications = useCallback(async () => {
    if (!user || !isSupported) {
      setError('Il tuo browser non supporta le notifiche.')
      return false
    }

    setLoading(true)
    setError('')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Permesso notifiche negato. Controlla le impostazioni del browser.')
        return false
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
  }, [user, isSupported, updateProfileData])

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
