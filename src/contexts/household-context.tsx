import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/auth-context'
import { generateInviteCode } from '@/lib/utils'
import type { Household, UserProfile } from '@/types'

interface HouseholdContextType {
  households: Household[]
  currentHousehold: Household | null
  members: UserProfile[]
  loading: boolean
  selectHousehold: (id: string) => void
  createHousehold: (name: string) => Promise<string>
  joinHousehold: (inviteCode: string) => Promise<void>
  refreshHouseholds: () => Promise<void>
}

const HouseholdContext = createContext<HouseholdContextType | null>(null)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user, userProfile, addHouseholdId } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async (household: Household) => {
    try {
      const memberProfiles: UserProfile[] = []
      for (const uid of household.memberUids) {
        const docSnap = await getDoc(doc(db, 'users', uid))
        if (docSnap.exists()) {
          memberProfiles.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile)
        }
      }
      setMembers(memberProfiles)
    } catch (err) {
      console.error('Errore nel caricamento membri:', err)
      setMembers([])
    }
  }, [])

  const fetchHouseholds = useCallback(async () => {
    if (!userProfile?.householdIds?.length) {
      setHouseholds([])
      setCurrentHousehold(null)
      setMembers([])
      setLoading(false)
      return
    }

    try {
      const results: Household[] = []
      for (const hId of userProfile.householdIds) {
        const docSnap = await getDoc(doc(db, 'households', hId))
        if (docSnap.exists()) {
          results.push({ id: docSnap.id, ...docSnap.data() } as Household)
        }
      }

      setHouseholds(results)

      if (results.length > 0) {
        const selected = results[0]
        setCurrentHousehold(selected)
        await fetchMembers(selected)
      }
    } catch (err) {
      console.error('Errore nel caricamento case:', err)
    } finally {
      setLoading(false)
    }
  }, [userProfile?.householdIds, fetchMembers])

  useEffect(() => {
    if (userProfile) {
      fetchHouseholds()
    } else {
      setHouseholds([])
      setCurrentHousehold(null)
      setMembers([])
      setLoading(false)
    }
  }, [userProfile, fetchHouseholds])

  function selectHousehold(id: string) {
    const h = households.find((h) => h.id === id)
    if (h) {
      setCurrentHousehold(h)
      fetchMembers(h)
    }
  }

  async function createHousehold(name: string): Promise<string> {
    if (!user) throw new Error('Devi essere autenticato')

    try {
      const inviteCode = generateInviteCode()
      const householdData = {
        name,
        memberUids: [user.uid],
        inviteCode,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }
      const docRef = await addDoc(collection(db, 'households'), householdData)

      await updateDoc(doc(db, 'users', user.uid), {
        householdIds: arrayUnion(docRef.id),
      })

      // Aggiorna stato locale direttamente senza aspettare useEffect
      const newHousehold: Household = {
        id: docRef.id,
        ...householdData,
        createdAt: householdData.createdAt as Household['createdAt'],
      }
      setHouseholds((prev) => [...prev, newHousehold])
      setCurrentHousehold(newHousehold)

      // Aggiorna membri con l'utente corrente
      if (userProfile) {
        setMembers([userProfile])
      }

      // Aggiorna profilo locale con il nuovo householdId
      addHouseholdId(docRef.id)

      return docRef.id
    } catch (err) {
      console.error('Errore creazione casa:', err)
      throw err
    }
  }

  async function joinHousehold(inviteCode: string) {
    if (!user) throw new Error('Devi essere autenticato')

    const normalizedCode = inviteCode.toUpperCase()
    let snap
    try {
      const q = query(collection(db, 'households'), where('inviteCode', '==', normalizedCode))
      snap = await getDocs(q)
    } catch (err) {
      console.error('Errore ricerca casa:', err)
      throw new Error('Impossibile verificare il codice. Riprova piu tardi.')
    }

    if (snap.empty) {
      throw new Error('Codice invito non valido')
    }

    const householdDoc = snap.docs[0]
    const householdData = householdDoc.data() as Omit<Household, 'id'>
    const alreadyMember = householdData.memberUids.includes(user.uid)

    try {
      if (!alreadyMember) {
        await updateDoc(doc(db, 'households', householdDoc.id), {
          memberUids: arrayUnion(user.uid),
        })

        await updateDoc(doc(db, 'users', user.uid), {
          householdIds: arrayUnion(householdDoc.id),
        })
      }

      // Aggiorna stato locale
      const joined: Household = {
        id: householdDoc.id,
        ...householdData,
        memberUids: alreadyMember
          ? householdData.memberUids
          : [...householdData.memberUids, user.uid],
      }
      setHouseholds((prev) => {
        if (prev.some((h) => h.id === joined.id)) return prev
        return [...prev, joined]
      })
      setCurrentHousehold(joined)
      await fetchMembers(joined)

      // Aggiorna profilo locale con il nuovo householdId
      if (!alreadyMember) {
        addHouseholdId(householdDoc.id)
      }
    } catch (err) {
      console.error('Errore join casa:', err)
      throw new Error('Impossibile entrare nella casa. Riprova piu tardi.')
    }
  }

  async function refreshHouseholds() {
    await fetchHouseholds()
  }

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        members,
        loading,
        selectHousehold,
        createHousehold,
        joinHousehold,
        refreshHouseholds,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (!context) {
    throw new Error('useHousehold deve essere usato dentro HouseholdProvider')
  }
  return context
}
