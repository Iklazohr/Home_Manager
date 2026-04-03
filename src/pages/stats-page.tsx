import { useMemo, useState } from 'react'
import { format, subDays } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'
import {
  BarChart3Icon,
  TrendingUpIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  HomeIcon,
  UserIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompletions, useChores } from '@/hooks/use-chores'
import { useHousehold } from '@/contexts/household-context'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'

type ViewMode = 'casa' | 'utente'

export function StatsPage() {
  const { currentHousehold, members } = useHousehold()
  const { user } = useAuth()
  const { completions } = useCompletions()
  const { chores } = useChores()
  const [view, setView] = useState<ViewMode>('casa')

  const houseStats = useMemo(() => {
    const total = completions.length
    const onTime = completions.filter((c) => c.wasOnTime).length
    const late = total - onTime
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0
    const pending = chores.filter((c) => c.status !== 'completato').length
    const overdue = chores.filter((c) => c.status === 'in_ritardo').length

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i)
      const dayCompletions = completions.filter((c) => {
        const completedAt = (c.completedAt as Timestamp).toDate()
        return format(completedAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })
      return {
        day: format(day, 'EEE', { locale: it }),
        count: dayCompletions.length,
      }
    })
    const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1)

    return { total, onTime, late, onTimeRate, pending, overdue, last7Days, maxDayCount }
  }, [completions, chores])

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const userCompletions = completions.filter((c) => c.completedBy === m.uid)
      const userOnTime = userCompletions.filter((c) => c.wasOnTime).length
      const userTotal = userCompletions.length
      const userRate = userTotal > 0 ? Math.round((userOnTime / userTotal) * 100) : 0
      const isAssignedTo = (c: { assignedTo: string }) => c.assignedTo === m.uid || c.assignedTo === 'everyone'
      const pending = chores.filter((c) => isAssignedTo(c) && c.status !== 'completato').length
      const overdue = chores.filter((c) => isAssignedTo(c) && c.status === 'in_ritardo').length

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const day = subDays(new Date(), 6 - i)
        const dayCompletions = userCompletions.filter((c) => {
          const completedAt = (c.completedAt as Timestamp).toDate()
          return format(completedAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        })
        return {
          day: format(day, 'EEE', { locale: it }),
          count: dayCompletions.length,
        }
      })
      const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1)

      return {
        uid: m.uid,
        name: m.displayName,
        total: userTotal,
        onTime: userOnTime,
        late: userTotal - userOnTime,
        rate: userRate,
        pending,
        overdue,
        last7Days,
        maxDayCount,
      }
    })
  }, [completions, members, chores])

  const myStats = memberStats.find((m) => m.uid === user?.uid)

  if (!currentHousehold) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Configura prima una casa dalla sezione Casa.</p>
      </div>
    )
  }

  // Dati in base alla vista corrente
  const current = view === 'casa'
    ? houseStats
    : myStats ?? { total: 0, onTime: 0, late: 0, onTimeRate: 0, pending: 0, overdue: 0, last7Days: [], maxDayCount: 1 }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <BarChart3Icon className="h-6 w-6" />
          Statistiche
        </h1>

        {/* Toggle casa / utente */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setView('casa')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
              view === 'casa' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <HomeIcon className="h-3.5 w-3.5" />
            Casa
          </button>
          <button
            onClick={() => setView('utente')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
              view === 'utente' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <UserIcon className="h-3.5 w-3.5" />
            Le Mie
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2Icon className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{current.total}</p>
            <p className="text-xs text-muted-foreground">Completate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUpIcon className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {view === 'casa' ? houseStats.onTimeRate : (myStats?.rate ?? 0)}%
            </p>
            <p className="text-xs text-muted-foreground">In tempo</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-6 text-center">
            <AlertTriangleIcon className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold">{current.overdue}</p>
            <p className="text-xs text-muted-foreground">In ritardo</p>
          </CardContent>
        </Card>
      </div>

      {/* Dettagli extra */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-lg font-bold">{current.onTime}</p>
            <p className="text-xs text-muted-foreground">Puntuali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-lg font-bold">{current.late}</p>
            <p className="text-xs text-muted-foreground">In ritardo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-lg font-bold">{current.pending}</p>
            <p className="text-xs text-muted-foreground">In attesa</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafico ultimi 7 giorni */}
      <Card>
        <CardHeader>
          <CardTitle>Ultimi 7 Giorni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {current.last7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{day.count}</span>
                <div
                  className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                  style={{ height: `${(day.count / current.maxDayCount) * 100}%`, minHeight: '4px' }}
                >
                  <div className="absolute inset-0 bg-primary rounded-t-md" />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Classifica membri — solo in vista casa */}
      {view === 'casa' && members.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Classifica Membri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...memberStats]
                .sort((a, b) => b.total - a.total)
                .map((ms, idx) => (
                  <div key={ms.uid} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-primary/10 text-primary'
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ms.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ms.total} completate &middot; {ms.rate}% in tempo
                      </p>
                    </div>
                    <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${ms.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
