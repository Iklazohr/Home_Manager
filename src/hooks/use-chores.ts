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
  where,
  limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useHousehold } from '@/contexts/household-context'
import { useAuth } from '@/contexts/auth-context'
import type { ChoreType, Chore, ChoreCompletion, ChoreFrequency, ScheduleMode } from '@/types'
import { FREQUENCY_DAYS } from '@/types'
import { addDays, nextSaturday, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, previousSaturday, previousMonday, previousTuesday, previousWednesday, previousThursday, previousFriday, differenceInDays, isSaturday, isSunday, isMonday, isTuesday, isWednesday, isThursday, isFriday } from 'date-fns'

// Aggiusta la data in base alla modalita di scheduling
function adjustDateForSchedule(date: Date, mode: ScheduleMode): Date {
  if (mode === 'esatto') return date

  if (mode === 'weekend') {
    if (isSaturday(date) || isSunday(date)) return date
    const prevSat = previousSaturday(date)
    const nextSat = nextSaturday(date)
    return differenceInDays(date, prevSat) <= differenceInDays(nextSat, date) ? prevSat : nextSat
  }

  const dayCheckers: Record<string, (d: Date) => boolean> = {
    lunedi: isMonday, martedi: isTuesday, mercoledi: isWednesday,
    giovedi: isThursday, venerdi: isFriday,
  }
  const nextDayFns: Record<string, (d: Date) => Date> = {
    lunedi: nextMonday, martedi: nextTuesday, mercoledi: nextWednesday,
    giovedi: nextThursday, venerdi: nextFriday,
  }
  const prevDayFns: Record<string, (d: Date) => Date> = {
    lunedi: previousMonday, martedi: previousTuesday, mercoledi: previousWednesday,
    giovedi: previousThursday, venerdi: previousFriday,
  }

  const checker = dayCheckers[mode]
  if (checker?.(date)) return date

  const prev = prevDayFns[mode]?.(date)
  const next = nextDayFns[mode]?.(date)
  if (!prev || !next) return date

  // Scegli il piu vicino, preferendo il futuro in caso di parita
  return differenceInDays(date, prev) < differenceInDays(next, date) ? prev : next
}

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
        let status = (data.status ?? 'in_attesa') as Chore['status']
        if (status !== 'completato' && status !== 'parziale' && nextDue < now) {
          status = 'in_ritardo'
        }
        return {
          id: d.id,
          ...data,
          status,
          scheduleMode: data.scheduleMode ?? 'esatto',
        } as Chore
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
    scheduleMode: ScheduleMode
    nextDueDate: Date
  }) {
    if (!currentHousehold) return

    const adjustedDate = adjustDateForSchedule(data.nextDueDate, data.scheduleMode)

    const ref = collection(db, 'households', currentHousehold.id, 'chores')
    await addDoc(ref, {
      ...data,
      nextDueDate: Timestamp.fromDate(adjustedDate),
      lastCompletedDate: null,
      status: 'in_attesa',
      createdAt: serverTimestamp(),
    })
    await fetchChores()
  }

  async function completeChore(choreId: string, partial = false) {
    if (!currentHousehold || !user) return

    const choreRef = doc(db, 'households', currentHousehold.id, 'chores', choreId)
    const chore = chores.find((c) => c.id === choreId)
    if (!chore) return

    const now = new Date()
    const dueDate = (chore.nextDueDate as Timestamp).toDate()
    const wasOnTime = now <= dueDate

    const completionsRef = collection(db, 'households', currentHousehold.id, 'completions')
    await addDoc(completionsRef, {
      choreId,
      choreTypeId: chore.choreTypeId,
      choreTypeName: chore.choreTypeName,
      completedBy: user.uid,
      completedAt: serverTimestamp(),
      wasOnTime,
      isPartial: partial,
      dueDate: chore.nextDueDate,
    })

    if (partial) {
      await updateDoc(choreRef, {
        status: 'parziale',
        lastCompletedDate: serverTimestamp(),
      })
    } else {
      // Cadence shift: se in ritardo, la prossima scadenza parte da ORA
      // Se puntuale, parte dalla scadenza originale
      const baseDate = wasOnTime ? dueDate : now
      const days = FREQUENCY_DAYS[chore.frequency]
      const rawNext = addDays(baseDate, days)
      const scheduleMode = chore.scheduleMode ?? 'esatto'
      const nextDue = adjustDateForSchedule(rawNext, scheduleMode)

      await updateDoc(choreRef, {
        status: 'in_attesa',
        lastCompletedDate: serverTimestamp(),
        nextDueDate: Timestamp.fromDate(nextDue),
      })
    }

    await fetchChores()
  }

  async function uncompleteChore(choreId: string) {
    if (!currentHousehold) return

    const choreRef = doc(db, 'households', currentHousehold.id, 'chores', choreId)
    const chore = chores.find((c) => c.id === choreId)
    if (!chore) return

    // Trova l'ultimo completamento per questo chore e rimuovilo
    const completionsRef = collection(db, 'households', currentHousehold.id, 'completions')
    const q = query(
      completionsRef,
      where('choreId', '==', choreId),
      orderBy('completedAt', 'desc'),
      limit(1)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      const lastCompletion = snap.docs[0]
      const completionData = lastCompletion.data()

      // Ripristina la scadenza precedente
      await updateDoc(choreRef, {
        status: 'in_attesa',
        nextDueDate: completionData.dueDate,
        lastCompletedDate: null,
      })

      await deleteDoc(doc(db, 'households', currentHousehold.id, 'completions', lastCompletion.id))
    } else {
      // Nessun completamento trovato, metti solo in_attesa
      await updateDoc(choreRef, { status: 'in_attesa' })
    }

    await fetchChores()
  }

  async function deleteChore(choreId: string) {
    if (!currentHousehold) return
    await deleteDoc(doc(db, 'households', currentHousehold.id, 'chores', choreId))
    await fetchChores()
  }

  return {
    chores,
    loading,
    addChore,
    completeChore,
    uncompleteChore,
    deleteChore,
    refresh: fetchChores,
  }
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
    setCompletions(snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      isPartial: d.data().isPartial ?? false,
    } as ChoreCompletion)))
    setLoading(false)
  }, [currentHousehold])

  useEffect(() => {
    fetchCompletions()
  }, [fetchCompletions])

  return { completions, loading, refresh: fetchCompletions }
}
