import { useEffect, useRef } from 'react'
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import { useHousehold } from '@/contexts/household-context'

// Notifiche in-app per eventi in tempo reale:
// - Nuovo membro si unisce alla casa
// - Attivita completata da un altro membro
// - Attivita assegnata a me da un altro utente
// - Scadenza imminente (gestita dal check periodico in use-notifications)
//
// Usa onSnapshot per reagire ai cambiamenti Firestore in tempo reale.
// La consegna effettiva avviene tramite Web Notifications API (main)
// o il bridge nativo (Android branch via use-local-notifications).

function deliver(title: string, body: string) {
  if (typeof window === 'undefined') return
  const w = window as unknown as {
    __hmNotifications?: { deliver?: (p: { title: string; body: string }) => void }
    Capacitor?: { isNativePlatform?: () => boolean }
  }
  if (w.__hmNotifications?.deliver) {
    w.__hmNotifications.deliver({ title, body })
    return
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.svg' })
  }
}

export function useEventNotifications() {
  const { user, userProfile } = useAuth()
  const { currentHousehold } = useHousehold()
  const initialLoadRef = useRef(true)
  const prevMemberCountRef = useRef<number | null>(null)
  const seenCompletionIdsRef = useRef<Set<string>>(new Set())
  const seenChoreIdsRef = useRef<Set<string>>(new Set())

  const enabled = userProfile?.notificationsEnabled ?? false

  // Listener: nuovi membri
  useEffect(() => {
    if (!currentHousehold || !user || !enabled) return

    const unsub = onSnapshot(doc(db, 'households', currentHousehold.id), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const memberUids: string[] = data.memberUids ?? []
      const prevCount = prevMemberCountRef.current

      if (prevCount !== null && memberUids.length > prevCount) {
        const newCount = memberUids.length - prevCount
        deliver(
          'Nuovo membro',
          `${newCount === 1 ? 'Un nuovo membro si e unito' : `${newCount} nuovi membri si sono uniti`} alla casa ${currentHousehold.name}`
        )
      }
      prevMemberCountRef.current = memberUids.length
    })

    return () => unsub()
  }, [currentHousehold, user, enabled])

  // Listener: completamenti di altri membri
  useEffect(() => {
    if (!currentHousehold || !user || !enabled) return

    const ref = collection(db, 'households', currentHousehold.id, 'completions')
    const q = query(ref, orderBy('completedAt', 'desc'), limit(10))

    const unsub = onSnapshot(q, (snap) => {
      if (initialLoadRef.current) {
        snap.docs.forEach((d) => seenCompletionIdsRef.current.add(d.id))
        initialLoadRef.current = false
        return
      }

      for (const change of snap.docChanges()) {
        if (change.type !== 'added') continue
        if (seenCompletionIdsRef.current.has(change.doc.id)) continue
        seenCompletionIdsRef.current.add(change.doc.id)

        const data = change.doc.data()
        if (data.completedBy === user.uid) continue

        deliver(
          data.isPartial ? 'Attivita parzialmente completata' : 'Attivita completata',
          `${data.choreTypeName} e stata ${data.isPartial ? 'parzialmente completata' : 'completata'}`
        )
      }
    })

    return () => unsub()
  }, [currentHousehold, user, enabled])

  // Listener: attivita assegnate a me
  useEffect(() => {
    if (!currentHousehold || !user || !enabled) return

    const ref = collection(db, 'households', currentHousehold.id, 'chores')
    const q = query(ref, orderBy('createdAt', 'desc'), limit(10))
    let isFirstLoad = true

    const unsub = onSnapshot(q, (snap) => {
      if (isFirstLoad) {
        snap.docs.forEach((d) => seenChoreIdsRef.current.add(d.id))
        isFirstLoad = false
        return
      }

      for (const change of snap.docChanges()) {
        if (change.type !== 'added') continue
        if (seenChoreIdsRef.current.has(change.doc.id)) continue
        seenChoreIdsRef.current.add(change.doc.id)

        const data = change.doc.data()
        if (data.assignedTo !== user.uid) continue

        deliver(
          'Nuova attivita assegnata',
          `Ti e stata assegnata: ${data.choreTypeName}`
        )
      }
    })

    return () => unsub()
  }, [currentHousehold, user, enabled])
}
