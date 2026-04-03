import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  PlusIcon,
  Trash2Icon,
  CheckCircleIcon,
  ArrowUpDownIcon,
} from 'lucide-react'
import type { Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useChoreTypes, useChores } from '@/hooks/use-chores'
import { useHousehold } from '@/contexts/household-context'
import { useAuth } from '@/contexts/auth-context'
import { CHORE_ICONS, getChoreIcon } from '@/lib/chore-icons'
import { FREQUENCY_LABELS, FREQUENCY_DAYS, type ChoreFrequency } from '@/types'
import { cn } from '@/lib/utils'

type SortMode = 'scadenza' | 'nome' | 'frequenza'

const selectClasses =
  'flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm [&>option]:bg-card [&>option]:text-foreground'

export function ChoresPage() {
  const { user } = useAuth()
  const { currentHousehold, members } = useHousehold()
  const { choreTypes, addChoreType, deleteChoreType } = useChoreTypes()
  const { chores, addChore, completeChore, deleteChore } = useChores()

  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('scadenza')

  // New chore type form
  const [typeName, setTypeName] = useState('')
  const [typeIcon, setTypeIcon] = useState('sparkles')
  const [typeDesc, setTypeDesc] = useState('')
  const [typeFreq, setTypeFreq] = useState<ChoreFrequency>('settimanale')

  // Assign chore form — precompilato quando si clicca su un tipo
  const [choreTypeId, setChoreTypeId] = useState('')
  const [choreAssignedTo, setChoreAssignedTo] = useState('')
  const [choreFrequency, setChoreFrequency] = useState<ChoreFrequency>('settimanale')
  const [choreDueDate, setChoreDueDate] = useState('')

  const getMemberName = (uid: string) =>
    uid === 'everyone' ? 'Tutti' : (members.find((m) => m.uid === uid)?.displayName ?? 'N/A')

  // Ordinamento attivita
  const sortedChores = useMemo(() => {
    const sorted = [...chores]
    switch (sortMode) {
      case 'nome':
        sorted.sort((a, b) => a.choreTypeName.localeCompare(b.choreTypeName))
        break
      case 'frequenza':
        sorted.sort((a, b) => FREQUENCY_DAYS[a.frequency] - FREQUENCY_DAYS[b.frequency])
        break
      case 'scadenza':
      default:
        // gia ordinato per scadenza dal hook
        break
    }
    return sorted
  }, [chores, sortMode])

  function openAssignFromType(ct: { id: string; defaultFrequency: ChoreFrequency }) {
    setChoreTypeId(ct.id)
    setChoreFrequency(ct.defaultFrequency)
    setChoreAssignedTo('')
    setChoreDueDate('')
    setShowAssignDialog(true)
  }

  async function handleAddType() {
    if (!typeName || !user) return
    await addChoreType({
      name: typeName,
      icon: typeIcon,
      description: typeDesc,
      defaultFrequency: typeFreq,
      createdBy: user.uid,
    })
    setTypeName('')
    setTypeDesc('')
    setTypeIcon('sparkles')
    setShowTypeDialog(false)
  }

  async function handleAddChore() {
    if (!choreTypeId || !choreAssignedTo || !choreDueDate) return
    const ct = choreTypes.find((t) => t.id === choreTypeId)
    if (!ct) return
    await addChore({
      choreTypeId: ct.id,
      choreTypeName: ct.name,
      choreTypeIcon: ct.icon,
      assignedTo: choreAssignedTo,
      frequency: choreFrequency,
      nextDueDate: new Date(choreDueDate),
    })
    setChoreTypeId('')
    setChoreAssignedTo('')
    setChoreDueDate('')
    setShowAssignDialog(false)
  }

  if (!currentHousehold) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Configura prima una casa dalla sezione Casa.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-primary">Attivita</h1>

      {/* Tipi di attivita — clicca per assegnare */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Tipi di Attivita</CardTitle>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowTypeDialog(true)}
            title="Nuovo tipo"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {choreTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun tipo di attivita creato. Premi + per crearne uno!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {choreTypes.map((ct) => {
                const Icon = getChoreIcon(ct.icon)
                return (
                  <div
                    key={ct.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    onClick={() => openAssignFromType(ct)}
                    title="Clicca per assegnare"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ct.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {FREQUENCY_LABELS[ct.defaultFrequency]}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChoreType(ct.id)
                      }}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attivita programmate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Attivita Programmate</CardTitle>
          {chores.length > 1 && (
            <div className="flex items-center gap-1">
              <ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                className="text-xs bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
              >
                <option value="scadenza">Scadenza</option>
                <option value="nome">Nome</option>
                <option value="frequenza">Frequenza</option>
              </select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {chores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna attivita programmata. Clicca su un tipo di attivita per assegnarla.
            </p>
          ) : (
            <div className="space-y-3">
              {sortedChores.map((chore) => {
                const Icon = getChoreIcon(chore.choreTypeIcon)
                const due = (chore.nextDueDate as Timestamp).toDate()
                return (
                  <div
                    key={chore.id}
                    className={cn(
                      'flex items-center gap-3 sm:gap-4 p-3 rounded-lg border',
                      chore.status === 'in_ritardo'
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-border bg-card/50'
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{chore.choreTypeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getMemberName(chore.assignedTo)} &middot;{' '}
                        {FREQUENCY_LABELS[chore.frequency]} &middot;{' '}
                        {format(due, 'd MMM', { locale: it })}
                      </p>
                    </div>
                    <Badge
                      variant={chore.status === 'in_ritardo' ? 'destructive' : 'secondary'}
                      className="hidden sm:inline-flex"
                    >
                      {chore.status === 'in_ritardo' ? 'In ritardo' : 'In attesa'}
                    </Badge>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => completeChore(chore.id)}
                        title="Completa"
                      >
                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteChore(chore.id)}
                        title="Elimina"
                      >
                        <Trash2Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Nuovo Tipo di Attivita */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Tipo di Attivita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Es. Pulire il bagno"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Input
                placeholder="Dettagli sull'attivita"
                value={typeDesc}
                onChange={(e) => setTypeDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Icona</Label>
              <div className="grid grid-cols-6 gap-2 max-h-52 overflow-y-auto">
                {CHORE_ICONS.map((opt) => (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => setTypeIcon(opt.name)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-colors',
                      typeIcon === opt.name
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent/30'
                    )}
                    title={opt.label}
                  >
                    <opt.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Frequenza predefinita</Label>
              <select
                className={selectClasses}
                value={typeFreq}
                onChange={(e) => setTypeFreq(e.target.value as ChoreFrequency)}
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTypeDialog(false)}>Annulla</Button>
            <Button onClick={handleAddType}>Crea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Assegna Attivita */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assegna Attivita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo di attivita</Label>
              <select
                className={selectClasses}
                value={choreTypeId}
                onChange={(e) => {
                  setChoreTypeId(e.target.value)
                  const ct = choreTypes.find((t) => t.id === e.target.value)
                  if (ct) setChoreFrequency(ct.defaultFrequency)
                }}
              >
                <option value="">Seleziona...</option>
                {choreTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assegna a</Label>
              <select
                className={selectClasses}
                value={choreAssignedTo}
                onChange={(e) => setChoreAssignedTo(e.target.value)}
              >
                <option value="">Seleziona...</option>
                <option value="everyone">Tutti i membri</option>
                {members.map((m) => (
                  <option key={m.uid} value={m.uid}>{m.displayName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Frequenza</Label>
              <select
                className={selectClasses}
                value={choreFrequency}
                onChange={(e) => setChoreFrequency(e.target.value as ChoreFrequency)}
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Prima scadenza</Label>
              <Input
                type="date"
                className="color-scheme-dark"
                value={choreDueDate}
                onChange={(e) => setChoreDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Annulla</Button>
            <Button onClick={handleAddChore}>Assegna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
