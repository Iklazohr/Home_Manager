import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  Trash2Icon,
  CheckCircleIcon,
  ArrowUpDownIcon,
  UndoIcon,
  CircleDotIcon,
  FilterIcon,
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
import {
  FREQUENCY_LABELS,
  FREQUENCY_DAYS,
  CHORE_CATEGORY_LABELS,
  SCHEDULE_MODE_LABELS,
  type ChoreFrequency,
  type ChoreCategory,
  type ScheduleMode,
} from '@/types'
import { cn } from '@/lib/utils'
import { staggerContainer, fadeInUp, listItem } from '@/lib/animations'

type SortMode = 'nome' | 'frequenza' | 'categoria'

const selectClasses =
  'flex h-9 w-full rounded-md border border-input bg-card text-foreground px-3 py-1 text-sm [&>option]:bg-card [&>option]:text-foreground'

export function ChoresPage() {
  const { user } = useAuth()
  const { currentHousehold, members } = useHousehold()
  const { choreTypes, addChoreType, deleteChoreType } = useChoreTypes()
  const { chores, addChore, completeChore, uncompleteChore, deleteChore } = useChores()

  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('nome')
  const [filterCategory, setFilterCategory] = useState<ChoreCategory | ''>('')

  // New chore type form
  const [typeName, setTypeName] = useState('')
  const [typeIcon, setTypeIcon] = useState('sparkles')
  const [typeDesc, setTypeDesc] = useState('')
  const [typeFreq, setTypeFreq] = useState<ChoreFrequency>('settimanale')
  const [typeCategory, setTypeCategory] = useState<ChoreCategory>('altro')

  // Assign chore form
  const [choreTypeId, setChoreTypeId] = useState('')
  const [choreAssignedTo, setChoreAssignedTo] = useState('')
  const [choreFrequency, setChoreFrequency] = useState<ChoreFrequency>('settimanale')
  const [choreScheduleMode, setChoreScheduleMode] = useState<ScheduleMode>('esatto')
  const [choreDueDate, setChoreDueDate] = useState('')

  const getMemberName = (uid: string) =>
    uid === 'everyone' ? 'Tutti' : (members.find((m) => m.uid === uid)?.displayName ?? 'N/A')

  const sortedChoreTypes = useMemo(() => {
    let filtered = [...choreTypes]
    if (filterCategory) {
      filtered = filtered.filter((ct) => (ct.category ?? 'altro') === filterCategory)
    }
    switch (sortMode) {
      case 'nome':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'frequenza':
        filtered.sort((a, b) => FREQUENCY_DAYS[a.defaultFrequency] - FREQUENCY_DAYS[b.defaultFrequency])
        break
      case 'categoria':
        filtered.sort((a, b) => (a.category ?? 'altro').localeCompare(b.category ?? 'altro'))
        break
    }
    return filtered
  }, [choreTypes, sortMode, filterCategory])

  function openAssignFromType(ct: { id: string; defaultFrequency: ChoreFrequency }) {
    setChoreTypeId(ct.id)
    setChoreFrequency(ct.defaultFrequency)
    setChoreScheduleMode('esatto')
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
      category: typeCategory,
      createdBy: user.uid,
    })
    setTypeName('')
    setTypeDesc('')
    setTypeIcon('sparkles')
    setTypeCategory('altro')
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
      scheduleMode: choreScheduleMode,
      nextDueDate: new Date(choreDueDate),
    })
    setChoreTypeId('')
    setChoreAssignedTo('')
    setChoreDueDate('')
    setChoreScheduleMode('esatto')
    setShowAssignDialog(false)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'in_ritardo':
        return <Badge variant="destructive">In ritardo</Badge>
      case 'parziale':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Parziale</Badge>
      default:
        return <Badge variant="secondary">In attesa</Badge>
    }
  }

  if (!currentHousehold) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Configura prima una casa dalla sezione Casa.</p>
      </div>
    )
  }

  return (
    <motion.div
      className="p-6 space-y-6 max-w-5xl mx-auto"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={fadeInUp} className="text-2xl font-bold text-primary">Attivita</motion.h1>

      {/* Tipi di attivita */}
      <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <CardTitle>Tipi di Attivita</CardTitle>
          <div className="flex items-center gap-2">
            {/* Filtro categoria */}
            <div className="flex items-center gap-1">
              <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                className="text-xs bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ChoreCategory | '')}
              >
                <option value="">Tutte</option>
                {Object.entries(CHORE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            {choreTypes.length > 1 && (
              <div className="flex items-center gap-1">
                <ArrowUpDownIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  className="text-xs bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                >
                  <option value="nome">Nome</option>
                  <option value="frequenza">Frequenza</option>
                  <option value="categoria">Categoria</option>
                </select>
              </div>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowTypeDialog(true)}
              title="Nuovo tipo"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedChoreTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {filterCategory
                ? 'Nessun tipo in questa categoria.'
                : 'Nessun tipo di attivita creato. Premi + per crearne uno!'}
            </p>
          ) : (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" variants={staggerContainer} initial="hidden" animate="show">
              {sortedChoreTypes.map((ct) => {
                const Icon = getChoreIcon(ct.icon)
                return (
                  <motion.div
                    key={ct.id}
                    variants={listItem}
                    whileHover={{ y: -2, borderColor: 'rgba(0, 200, 200, 0.4)' }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 cursor-pointer transition-colors"
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
                        {ct.category && ct.category !== 'altro' && (
                          <> &middot; {CHORE_CATEGORY_LABELS[ct.category]}</>
                        )}
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
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Attivita programmate */}
      <motion.div variants={fadeInUp}>
      <Card>
        <CardHeader>
          <CardTitle>Attivita Programmate</CardTitle>
        </CardHeader>
        <CardContent>
          {chores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna attivita programmata. Clicca su un tipo di attivita per assegnarla.
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
            <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
              {chores.map((chore) => {
                const Icon = getChoreIcon(chore.choreTypeIcon)
                const due = (chore.nextDueDate as Timestamp).toDate()
                const showUndo = chore.status === 'parziale' || chore.lastCompletedDate != null
                return (
                  <motion.div
                    key={chore.id}
                    variants={listItem}
                    layout
                    exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                    className={cn(
                      'flex items-center gap-3 sm:gap-4 p-3 rounded-lg border',
                      chore.status === 'in_ritardo'
                        ? 'border-destructive/30 bg-destructive/5'
                        : chore.status === 'parziale'
                        ? 'border-yellow-500/30 bg-yellow-500/5'
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
                        {chore.scheduleMode && chore.scheduleMode !== 'esatto' && (
                          <> &middot; {SCHEDULE_MODE_LABELS[chore.scheduleMode]}</>
                        )}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      {getStatusBadge(chore.status)}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {/* Completamento parziale */}
                      {chore.status !== 'parziale' && (
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => completeChore(chore.id, true)}
                            title="Completamento parziale"
                          >
                            <CircleDotIcon className="h-4 w-4 text-yellow-400" />
                          </Button>
                        </motion.div>
                      )}
                      {/* Completamento totale */}
                      <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => completeChore(chore.id)}
                          title="Completa"
                        >
                          <CheckCircleIcon className="h-4 w-4 text-green-400" />
                        </Button>
                      </motion.div>
                      {/* Undo */}
                      {showUndo && (
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => uncompleteChore(chore.id)}
                            title="Segna come non completata"
                          >
                            <UndoIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </motion.div>
                      )}
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
                  </motion.div>
                )
              })}
            </motion.div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
      </motion.div>

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
              <Label>Categoria</Label>
              <select
                className={selectClasses}
                value={typeCategory}
                onChange={(e) => setTypeCategory(e.target.value as ChoreCategory)}
              >
                {Object.entries(CHORE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
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
              <Label>Modalita scadenza</Label>
              <select
                className={selectClasses}
                value={choreScheduleMode}
                onChange={(e) => setChoreScheduleMode(e.target.value as ScheduleMode)}
              >
                {Object.entries(SCHEDULE_MODE_LABELS).map(([key, label]) => (
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
    </motion.div>
  )
}
