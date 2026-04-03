import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useHousehold } from '@/contexts/household-context'
import { useAuth } from '@/contexts/auth-context'
import type { ChoreType, Chore, ChoreCompletion, ChoreFrequency } from '@/types'
import { FREQUENCY_DAYS } from '@/types'
import { addDays } from 'date-fns'

export function useChoreTypes() {
  const { currentHousehold } = useHousehold()
  const [choreTypes, setChoreTypes] = useState<ChoreType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChoreTypes = useCallback(async () => {
    if (!currentHousehold) {
      setChoreTypes([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'households', currentHousehold.id, 'choreTypes')
    const snap = await getDocs(ref)
    setChoreTypes(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChoreType)))
    setLoading(false)
  }, [currentHousehold])

  useEffect(() => {
    fetchChoreTypes()
  }, [fetchChoreTypes])

  async function addChoreType(data: Omit<ChoreType, 'id'>) {
    if (!currentHousehold) return
    const ref = collection(db, 'households', currentHousehold.id, 'choreTypes')
    await addDoc(ref, data)
    await fetchChoreTypes()
  }

  async function deleteChoreType(id: string) {
    if (!currentHousehold) return
    await deleteDoc(doc(db, 'households', currentHousehold.id, 'choreTypes', id))
    await fetchChoreTypes()
  }

  return { choreTypes, loading, addChoreType, deleteChoreType, refresh: fetchChoreTypes }
}

export function useChores() {
  const { currentHousehold } = useHousehold()
  const { user } = useAuth()
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChores = useCallback(async () => {
    if (!currentHousehold) {
      setChores([])
      setLoading(false)
      return
    }

    try {
      const ref = collection(db, 'households', currentHousehold.id, 'chores')
      const q = query(ref, orderBy('nextDueDate', 'asc'))
      const snap = await getDocs(q)
      const now = new Date()

      const result = snap.docs.map((d) => {
        const data = d.data()
        const nextDue = (data.nextDueDate as Timestamp).toDate()
        let status = data.status as Chore['status']
        if (status !== 'completato' && nextDue < now) {
          status = 'in_ritardo'
        }
        return { id: d.id, ...data, status } as Chore
      })

      setChores(result)
    } catch (err) {
      console.error('Errore nel caricamento attivita:', err)
    } finally {
      setLoading(false)
    }
  }, [currentHousehold])

  useEffect(() => {
    fetchChores()
  }, [fetchChores])

  async function addChore(data: {
    choreTypeId: string
    choreTypeName: string
    choreTypeIcon: string
    assignedTo: string
    frequency: ChoreFrequency
    nextDueDate: Date
  }) {
    if (!currentHousehold) return

    const ref = collection(db, 'households', currentHousehold.id, 'chores')
    await addDoc(ref, {
      ...data,
      nextDueDate: Timestamp.fromDate(data.nextDueDate),
      lastCompletedDate: null,
      status: 'in_attesa',
      createdAt: serverTimestamp(),
    })
    await fetchChores()
  }

  async function completeChore(choreId: string) {
    if (!currentHousehold || !user) return

    const choreRef = doc(db, 'households', currentHousehold.id, 'chores', choreId)
    const chore = chores.find((c) => c.id === choreId)
    if (!chore) return

    const now = new Date()
    const dueDate = (chore.nextDueDate as Timestamp).toDate()
    const wasOnTime = now <= dueDate

    // Registra completamento
    const completionsRef = collection(db, 'households', currentHousehold.id, 'completions')
    await addDoc(completionsRef, {
      choreId,
      choreTypeId: chore.choreTypeId,
      choreTypeName: chore.choreTypeName,
      completedBy: user.uid,
      completedAt: serverTimestamp(),
      wasOnTime,
      dueDate: chore.nextDueDate,
    })

    // Calcola prossima scadenza
    const days = FREQUENCY_DAYS[chore.frequency]
    const nextDue = addDays(now, days)

    await updateDoc(choreRef, {
      status: 'in_attesa',
      lastCompletedDate: serverTimestamp(),
      nextDueDate: Timestamp.fromDate(nextDue),
    })

    await fetchChores()
  }

  async function deleteChore(choreId: string) {
    if (!currentHousehold) return
    await deleteDoc(doc(db, 'households', currentHousehold.id, 'chores', choreId))
    await fetchChores()
  }

  return { chores, loading, addChore, completeChore, deleteChore, refresh: fetchChores }
}

export function useCompletions() {
  const { currentHousehold } = useHousehold()
  const [completions, setCompletions] = useState<ChoreCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCompletions = useCallback(async () => {
    if (!currentHousehold) {
      setCompletions([])
      setLoading(false)
      return
    }

    const ref = collection(db, 'households', currentHousehold.id, 'completions')
    const q = query(ref, orderBy('completedAt', 'desc'))
    const snap = await getDocs(q)
    setCompletions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChoreCompletion)))
    setLoading(false)
  }, [currentHousehold])

  useEffect(() => {
    fetchCompletions()
  }, [fetchCompletions])

  return { completions, loading, refresh: fetchCompletions }
}
