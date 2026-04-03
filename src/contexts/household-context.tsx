import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
  const { user, userProfile, refreshProfile } = useAuth()
  const [households, setHouseholds] = useState<Household[]>([])
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchHouseholds() {
    if (!userProfile?.householdIds?.length) {
      setHouseholds([])
      setCurrentHousehold(null)
      setMembers([])
      setLoading(false)
      return
    }

    const results: Household[] = []
    for (const hId of userProfile.householdIds) {
      const docSnap = await getDoc(doc(db, 'households', hId))
      if (docSnap.exists()) {
        results.push({ id: docSnap.id, ...docSnap.data() } as Household)
      }
    }

    setHouseholds(results)

    if (results.length > 0 && !currentHousehold) {
      setCurrentHousehold(results[0])
      await fetchMembers(results[0])
    }

    setLoading(false)
  }

  async function fetchMembers(household: Household) {
    const memberProfiles: UserProfile[] = []
    for (const uid of household.memberUids) {
      const docSnap = await getDoc(doc(db, 'users', uid))
      if (docSnap.exists()) {
        memberProfiles.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile)
      }
    }
    setMembers(memberProfiles)
  }

  useEffect(() => {
    if (userProfile) {
      fetchHouseholds()
    } else {
      setLoading(false)
    }
  }, [userProfile])

  function selectHousehold(id: string) {
    const h = households.find((h) => h.id === id)
    if (h) {
      setCurrentHousehold(h)
      fetchMembers(h)
    }
  }

  async function createHousehold(name: string): Promise<string> {
    if (!user) throw new Error('Devi essere autenticato')

    const inviteCode = generateInviteCode()
    const docRef = await addDoc(collection(db, 'households'), {
      name,
      memberUids: [user.uid],
      inviteCode,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
    })

    await updateDoc(doc(db, 'users', user.uid), {
      householdIds: arrayUnion(docRef.id),
    })

    await refreshProfile()
    return docRef.id
  }

  async function joinHousehold(inviteCode: string) {
    if (!user) throw new Error('Devi essere autenticato')

    const q = query(collection(db, 'households'), where('inviteCode', '==', inviteCode.toUpperCase()))
    const snap = await getDocs(q)

    if (snap.empty) {
      throw new Error('Codice invito non valido')
    }

    const householdDoc = snap.docs[0]

    await updateDoc(doc(db, 'households', householdDoc.id), {
      memberUids: arrayUnion(user.uid),
    })

    await updateDoc(doc(db, 'users', user.uid), {
      householdIds: arrayUnion(householdDoc.id),
    })

    await refreshProfile()
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
