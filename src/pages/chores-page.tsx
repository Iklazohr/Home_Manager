import { useState } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import {
  PlusCircleIcon,
  Trash2Icon,
  CheckCircleIcon,
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
import { FREQUENCY_LABELS, type ChoreFrequency } from '@/types'
import { cn } from '@/lib/utils'

export function ChoresPage() {
  const { user } = useAuth()
  const { currentHousehold, members } = useHousehold()
  const { choreTypes, addChoreType, deleteChoreType } = useChoreTypes()
  const { chores, addChore, completeChore, deleteChore } = useChores()

  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [showChoreDialog, setShowChoreDialog] = useState(false)

  // New chore type form
  const [typeName, setTypeName] = useState('')
  const [typeIcon, setTypeIcon] = useState('sparkles')
  const [typeDesc, setTypeDesc] = useState('')
  const [typeFreq, setTypeFreq] = useState<ChoreFrequency>('settimanale')

  // New chore form
  const [choreTypeId, setChoreTypeId] = useState('')
  const [choreAssignedTo, setChoreAssignedTo] = useState('')
  const [choreFrequency, setChoreFrequency] = useState<ChoreFrequency>('settimanale')
  const [choreDueDate, setChoreDueDate] = useState('')

  const getMemberName = (uid: string) =>
    uid === 'everyone' ? 'Tutti' : (members.find((m) => m.uid === uid)?.displayName ?? 'N/A')

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
    setShowChoreDialog(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary">Attivita</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTypeDialog(true)}>
            <PlusCircleIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Nuovo </span>Tipo
          </Button>
          <Button size="sm" onClick={() => setShowChoreDialog(true)}>
            <PlusCircleIcon className="h-4 w-4" />
            Assegna
          </Button>
        </div>
      </div>

      {/* Chore types */}
      <Card>
        <CardHeader>
          <CardTitle>Tipi di Attivita</CardTitle>
        </CardHeader>
        <CardContent>
          {choreTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun tipo di attivita creato. Inizia creandone uno!
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {choreTypes.map((ct) => {
                const Icon = getChoreIcon(ct.icon)
                return (
                  <div
                    key={ct.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50"
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
                      onClick={() => deleteChoreType(ct.id)}
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

      {/* Active chores */}
      <Card>
        <CardHeader>
          <CardTitle>Attivita Programmate</CardTitle>
        </CardHeader>
        <CardContent>
          {chores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna attivita programmata.</p>
          ) : (
            <div className="space-y-3">
              {chores.map((chore) => {
                const Icon = getChoreIcon(chore.choreTypeIcon)
                const due = (chore.nextDueDate as Timestamp).toDate()
                return (
                  <div
                    key={chore.id}
                    className={cn(
                      'flex items-center gap-4 p-3 rounded-lg border',
                      chore.status === 'in_ritardo'
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-border bg-card/50'
                    )}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{chore.choreTypeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getMemberName(chore.assignedTo)} &middot;{' '}
                        {FREQUENCY_LABELS[chore.frequency]} &middot;{' '}
                        Scadenza: {format(due, 'd MMM', { locale: it })}
                      </p>
                    </div>
                    <Badge
                      variant={chore.status === 'in_ritardo' ? 'destructive' : 'secondary'}
                    >
                      {chore.status === 'in_ritardo' ? 'In ritardo' : 'In attesa'}
                    </Badge>
                    <div className="flex gap-1">
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

      {/* Dialog: New Chore Type */}
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
                className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm [&>option]:bg-card [&>option]:text-foreground"
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

      {/* Dialog: Assign Chore */}
      <Dialog open={showChoreDialog} onOpenChange={setShowChoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assegna Attivita</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo di attivita</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm [&>option]:bg-card [&>option]:text-foreground"
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
                className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm [&>option]:bg-card [&>option]:text-foreground"
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
                className="flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm [&>option]:bg-card [&>option]:text-foreground"
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
                value={choreDueDate}
                onChange={(e) => setChoreDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChoreDialog(false)}>Annulla</Button>
            <Button onClick={handleAddChore}>Assegna</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
