import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertTriangleIcon,
  CalendarIcon,
  ArrowRightIcon,
  PlusCircleIcon,
} from 'lucide-react'
import { format, isToday, isTomorrow, isBefore } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { useHousehold } from '@/contexts/household-context'
import { useChores } from '@/hooks/use-chores'
import { getChoreIcon } from '@/lib/chore-icons'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { userProfile } = useAuth()
  const { currentHousehold, members } = useHousehold()
  const { chores } = useChores()

  const todayChores = useMemo(() => {
    return chores.filter((c) => {
      const due = (c.nextDueDate as Timestamp).toDate()
      return isToday(due) || isBefore(due, new Date())
    })
  }, [chores])

  const upcomingChores = useMemo(() => {
    return chores
      .filter((c) => {
        const due = (c.nextDueDate as Timestamp).toDate()
        return !isToday(due) && !isBefore(due, new Date())
      })
      .slice(0, 5)
  }, [chores])

  const overdueCount = chores.filter((c) => c.status === 'in_ritardo').length
  const pendingCount = chores.filter((c) => c.status === 'in_attesa').length

  const getMemberName = (uid: string) => {
    if (uid === 'everyone') return 'Tutti'
    const m = members.find((m) => m.uid === uid)
    return m?.displayName ?? 'Non assegnato'
  }

  if (!currentHousehold) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="text-center">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-xl font-bold text-primary">Benvenuto, {userProfile?.displayName}!</h2>
              <p className="text-muted-foreground">
                Per iniziare, crea una nuova casa o unisciti a una esistente con un codice invito.
              </p>
              <Button asChild>
                <Link to="/casa">
                  <PlusCircleIcon className="h-4 w-4" />
                  Configura la tua casa
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-primary">
          Ciao, {userProfile?.displayName}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })} &mdash; {currentHousehold.name}
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <ClockIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">In attesa</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20 text-destructive">
              <AlertTriangleIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueCount}</p>
              <p className="text-sm text-muted-foreground">In ritardo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20 text-green-400">
              <CheckCircle2Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{chores.length}</p>
              <p className="text-sm text-muted-foreground">Totale attivita</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's chores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Attivita di Oggi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayChores.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessuna attivita per oggi. Buon riposo!</p>
          ) : (
            <div className="space-y-3">
              {todayChores.map((chore) => {
                const Icon = getChoreIcon(chore.choreTypeIcon)
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
                    <div className="flex-1">
                      <p className="text-sm font-medium">{chore.choreTypeName}</p>
                      <p className="text-xs text-muted-foreground">
                        Assegnato a: {getMemberName(chore.assignedTo)}
                      </p>
                    </div>
                    <Badge
                      variant={chore.status === 'in_ritardo' ? 'destructive' : 'secondary'}
                    >
                      {chore.status === 'in_ritardo' ? 'In ritardo' : 'In attesa'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              Prossime Attivita
            </span>
            <Button asChild variant="ghost" size="sm">
              <Link to="/calendario">
                Vedi tutto <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingChores.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nessuna attivita programmata.</p>
          ) : (
            <div className="space-y-3">
              {upcomingChores.map((chore) => {
                const Icon = getChoreIcon(chore.choreTypeIcon)
                const due = (chore.nextDueDate as Timestamp).toDate()
                return (
                  <div key={chore.id} className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{chore.choreTypeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {getMemberName(chore.assignedTo)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isTomorrow(due) ? 'Domani' : format(due, 'd MMM', { locale: it })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
