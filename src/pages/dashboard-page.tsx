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
import { staggerContainer, fadeInUp, scaleIn, listItem, counterPop } from '@/lib/animations'
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Card className="text-center">
            <CardContent className="pt-6 space-y-4">
              <motion.h2
                className="text-xl font-bold text-primary"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Benvenuto, {userProfile?.displayName}!
              </motion.h2>
              <p className="text-muted-foreground">
                Per iniziare, crea una nuova casa o unisciti a una esistente con un codice invito.
              </p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild>
                  <Link to="/casa">
                    <PlusCircleIcon className="h-4 w-4" />
                    Configura la tua casa
                  </Link>
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
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
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold text-primary">
          Ciao, {userProfile?.displayName}
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })} &mdash; {currentHousehold.name}
        </p>
      </motion.div>

      {/* Stats cards */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" variants={fadeInUp}>
        {[
          { icon: ClockIcon, value: pendingCount, label: 'In attesa', color: 'bg-primary/20 text-primary' },
          { icon: AlertTriangleIcon, value: overdueCount, label: 'In ritardo', color: 'bg-destructive/20 text-destructive' },
          { icon: CheckCircle2Icon, value: chores.length, label: 'Totale attivita', color: 'bg-green-500/20 text-green-400' },
        ].map((stat, i) => (
          <motion.div key={i} variants={scaleIn} whileHover={{ y: -2 }}>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <motion.p className="text-2xl font-bold" variants={counterPop}>
                    {stat.value}
                  </motion.p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Today's chores */}
      <motion.div variants={fadeInUp}>
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
              <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
                {todayChores.map((chore) => {
                  const Icon = getChoreIcon(chore.choreTypeIcon)
                  return (
                    <motion.div
                      key={chore.id}
                      variants={listItem}
                      layout
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-lg border transition-colors',
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
                        className={chore.status === 'parziale' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : undefined}
                      >
                        {chore.status === 'in_ritardo' ? 'In ritardo' : chore.status === 'parziale' ? 'Parziale' : 'In attesa'}
                      </Badge>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-primary" />
                Prossime Attivita
              </span>
              <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/calendario">
                    Vedi tutto <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingChores.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nessuna attivita programmata.</p>
            ) : (
              <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="show">
                {upcomingChores.map((chore) => {
                  const Icon = getChoreIcon(chore.choreTypeIcon)
                  const due = (chore.nextDueDate as Timestamp).toDate()
                  return (
                    <motion.div
                      key={chore.id}
                      variants={listItem}
                      className="flex items-center gap-4 p-3 rounded-lg border border-border bg-card/50"
                    >
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
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
