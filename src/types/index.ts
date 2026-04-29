import type { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  avatarUrl: string | null
  householdIds: string[]
  notificationsEnabled: boolean
  fcmToken: string | null
  createdAt: Timestamp
}

export interface Household {
  id: string
  name: string
  memberUids: string[]
  inviteCode: string
  createdBy: string
  createdAt: Timestamp
}

export type ChoreCategory =
  | 'cucina'
  | 'bagno'
  | 'camera'
  | 'soggiorno'
  | 'bucato'
  | 'esterno'
  | 'manutenzione'
  | 'altro'

export const CHORE_CATEGORY_LABELS: Record<ChoreCategory, string> = {
  cucina: 'Cucina',
  bagno: 'Bagno',
  camera: 'Camera',
  soggiorno: 'Soggiorno',
  bucato: 'Bucato',
  esterno: 'Esterno/Giardino',
  manutenzione: 'Manutenzione',
  altro: 'Altro',
}

export interface ChoreType {
  id: string
  name: string
  icon: string
  description: string
  defaultFrequency: ChoreFrequency
  category: ChoreCategory
  createdBy: string
}

export type ChoreFrequency =
  | 'settimanale'
  | 'bisettimanale'
  | 'mensile'
  | 'trimestrale'
  | 'semestrale'
  | 'annuale'

export type ScheduleMode = 'esatto' | 'weekend' | 'lunedi' | 'martedi' | 'mercoledi' | 'giovedi' | 'venerdi'

export const SCHEDULE_MODE_LABELS: Record<ScheduleMode, string> = {
  esatto: 'Giorno esatto',
  weekend: 'Weekend piu vicino',
  lunedi: 'Lunedi piu vicino',
  martedi: 'Martedi piu vicino',
  mercoledi: 'Mercoledi piu vicino',
  giovedi: 'Giovedi piu vicino',
  venerdi: 'Venerdi piu vicino',
}

export interface Chore {
  id: string
  choreTypeId: string
  choreTypeName: string
  choreTypeIcon: string
  assignedTo: string
  frequency: ChoreFrequency
  scheduleMode: ScheduleMode
  nextDueDate: Timestamp
  lastCompletedDate: Timestamp | null
  status: 'in_attesa' | 'completato' | 'in_ritardo' | 'parziale'
  createdAt: Timestamp
}

export interface ChoreCompletion {
  id: string
  choreId: string
  choreTypeId: string
  choreTypeName: string
  completedBy: string
  completedAt: Timestamp
  wasOnTime: boolean
  isPartial: boolean
  dueDate: Timestamp
}

export interface InAppNotification {
  id: string
  type: 'scadenza' | 'ritardo' | 'assegnazione' | 'completamento'
  title: string
  message: string
  choreId?: string
  read: boolean
  createdAt: Timestamp
}

export const FREQUENCY_LABELS: Record<ChoreFrequency, string> = {
  settimanale: 'Settimanale',
  bisettimanale: 'Ogni 2 settimane',
  mensile: 'Mensile',
  trimestrale: 'Trimestrale',
  semestrale: 'Semestrale',
  annuale: 'Annuale',
}

export const FREQUENCY_DAYS: Record<ChoreFrequency, number> = {
  settimanale: 7,
  bisettimanale: 14,
  mensile: 30,
  trimestrale: 90,
  semestrale: 180,
  annuale: 365,
}
