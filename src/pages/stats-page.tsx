import { useMemo } from 'react'
import { format, subDays } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Timestamp } from 'firebase/firestore'
import {
  BarChart3Icon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCompletions, useChores } from '@/hooks/use-chores'
import { useHousehold } from '@/contexts/household-context'
import { cn } from '@/lib/utils'

export function StatsPage() {
  const { currentHousehold, members } = useHousehold()
  const { completions } = useCompletions()
  const { chores } = useChores()

  const stats = useMemo(() => {
    const total = completions.length
    const onTime = completions.filter((c) => c.wasOnTime).length
    const late = total - onTime
    const onTimeRate = total > 0 ? Math.round((onTime / total) * 100) : 0

    // Per user stats
    const userStats = members.map((m) => {
      const userCompletions = completions.filter((c) => c.completedBy === m.uid)
      const userOnTime = userCompletions.filter((c) => c.wasOnTime).length
      const userTotal = userCompletions.length
      const userRate = userTotal > 0 ? Math.round((userOnTime / userTotal) * 100) : 0
      const pendingChores = chores.filter((c) => c.assignedTo === m.uid && c.status !== 'completato').length
      const overdueChores = chores.filter((c) => c.assignedTo === m.uid && c.status === 'in_ritardo').length

      return {
        uid: m.uid,
        name: m.displayName,
        total: userTotal,
        onTime: userOnTime,
        late: userTotal - userOnTime,
        rate: userRate,
        pending: pendingChores,
        overdue: overdueChores,
      }
    })

    // Last 7 days activity
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

    return { total, onTime, late, onTimeRate, userStats, last7Days, maxDayCount }
  }, [completions, members, chores])

  if (!currentHousehold) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Configura prima una casa dalla sezione Casa.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
        <BarChart3Icon className="h-6 w-6" />
        Statistiche
      </h1>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle2Icon className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Completate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUpIcon className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
            <p className="text-xs text-muted-foreground">In tempo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ClockIcon className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.onTime}</p>
            <p className="text-xs text-muted-foreground">Puntuali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertTriangleIcon className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.late}</p>
            <p className="text-xs text-muted-foreground">In ritardo</p>
          </CardContent>
        </Card>
      </div>

      {/* Last 7 days chart */}
      <Card>
        <CardHeader>
          <CardTitle>Attivita Ultimi 7 Giorni</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {stats.last7Days.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">{day.count}</span>
                <div
                  className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                  style={{ height: `${(day.count / stats.maxDayCount) * 100}%`, minHeight: '4px' }}
                >
                  <div
                    className="absolute inset-0 bg-primary rounded-t-md"
                    style={{ height: '100%' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per user stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiche per Membro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.userStats.map((us) => (
              <div key={us.uid} className="p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {us.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold">{us.name}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold">{us.total}</p>
                    <p className="text-xs text-muted-foreground">Completate</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">{us.rate}%</p>
                    <p className="text-xs text-muted-foreground">In tempo</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{us.pending}</p>
                    <p className="text-xs text-muted-foreground">In attesa</p>
                  </div>
                  <div>
                    <p className={cn("text-lg font-bold", us.overdue > 0 && "text-destructive")}>
                      {us.overdue}
                    </p>
                    <p className="text-xs text-muted-foreground">In ritardo</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${us.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
