import { useEffect, useRef } from 'react'
import type { Timestamp } from 'firebase/firestore'
import { isNativePlatform } from '@/lib/capacitor'
import { useAuth } from '@/contexts/auth-context'
import { useChores } from '@/hooks/use-chores'

// Schedula notifiche locali native per ogni attivita non completata.
// Funziona ad app chiusa, senza backend: il sistema Android si occupa
// del trigger alla scadenza.
//
// Ogni attivita genera fino a 2 promemoria:
//  - 24h prima della scadenza
//  - alla scadenza (se in futuro)
//
// Gli ID delle notifiche sono derivati dal chore.id per rescheduling
// deterministico (cancel + re-create ad ogni cambio chores).

// Notification id a 32-bit signed: hashing stabile del chore.id
function notificationId(choreId: string, offset: number): number {
  let hash = 0
  for (let i = 0; i < choreId.length; i++) {
    hash = ((hash << 5) - hash) + choreId.charCodeAt(i)
    hash |= 0
  }
  // Garantisce positivo e lascia spazio per l'offset (0 = 24h, 1 = due)
  return Math.abs(hash % 1_000_000_000) * 10 + offset
}

export function useLocalNotifications() {
  const { user, userProfile } = useAuth()
  const { chores } = useChores()
  const scheduledIdsRef = useRef<number[]>([])

  useEffect(() => {
    if (!isNativePlatform) return
    if (!user || !userProfile?.notificationsEnabled) return

    let cancelled = false

    const schedule = async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications')

        // Richiedi permesso se non ancora concesso
        const perm = await LocalNotifications.checkPermissions()
        if (perm.display !== 'granted') {
          const req = await LocalNotifications.requestPermissions()
          if (req.display !== 'granted') {
            console.warn('Permesso notifiche locali negato')
            return
          }
        }

        if (cancelled) return

        // Cancella le notifiche precedentemente schedulate da questa sessione
        if (scheduledIdsRef.current.length > 0) {
          await LocalNotifications.cancel({
            notifications: scheduledIdsRef.current.map((id) => ({ id })),
          })
          scheduledIdsRef.current = []
        }

        const now = new Date()
        const newIds: number[] = []
        const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = []

        for (const chore of chores) {
          if (chore.status === 'completato') continue
          // Solo le mie o assegnate a tutti
          if (chore.assignedTo !== user.uid && chore.assignedTo !== 'everyone') continue

          const due = (chore.nextDueDate as Timestamp).toDate()
          const reminder24h = new Date(due.getTime() - 24 * 60 * 60 * 1000)

          // Promemoria 24h prima
          if (reminder24h > now) {
            const id = notificationId(chore.id, 0)
            newIds.push(id)
            notifications.push({
              id,
              title: 'Promemoria faccenda',
              body: `${chore.choreTypeName} scade domani`,
              schedule: { at: reminder24h, allowWhileIdle: true },
            })
          }

          // Notifica alla scadenza
          if (due > now) {
            const id = notificationId(chore.id, 1)
            newIds.push(id)
            notifications.push({
              id,
              title: 'Faccenda in scadenza',
              body: `${chore.choreTypeName} e in scadenza ora`,
              schedule: { at: due, allowWhileIdle: true },
            })
          }
        }

        if (cancelled) return

        if (notifications.length > 0) {
          await LocalNotifications.schedule({ notifications })
          scheduledIdsRef.current = newIds
        }
      } catch (err) {
        console.error('Errore schedulazione notifiche locali:', err)
      }
    }

    void schedule()

    return () => {
      cancelled = true
    }
  }, [user, userProfile?.notificationsEnabled, chores])

  // Pulizia totale quando le notifiche vengono disabilitate
  useEffect(() => {
    if (!isNativePlatform) return
    if (userProfile?.notificationsEnabled) return
    if (scheduledIdsRef.current.length === 0) return

    const idsToCancel = scheduledIdsRef.current
    scheduledIdsRef.current = []

    void import('@capacitor/local-notifications').then(({ LocalNotifications }) => {
      LocalNotifications.cancel({
        notifications: idsToCancel.map((id) => ({ id })),
      }).catch((err) => {
        console.error('Errore cancellazione notifiche:', err)
      })
    })
  }, [userProfile?.notificationsEnabled])
}
