import { useState, useMemo } from 'react'
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from 'lucide-react'
import type { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChores } from '@/hooks/use-chores'
import { useHousehold } from '@/contexts/household-context'
import { getChoreIcon } from '@/lib/chore-icons'
import { cn } from '@/lib/utils'

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]

const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

export function CalendarPage() {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = useState(today)
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'))
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

  const { chores, completeChore } = useChores()
  const { members } = useHousehold()

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  const choresByDay = useMemo(() => {
    const map = new Map<string, typeof chores>()
    for (const chore of chores) {
      const due = (chore.nextDueDate as Timestamp).toDate()
      const key = format(due, 'yyyy-MM-dd')
      const existing = map.get(key) ?? []
      existing.push(chore)
      map.set(key, existing)
    }
    return map
  }, [chores])

  const selectedDayChores = useMemo(() => {
    return choresByDay.get(format(selectedDay, 'yyyy-MM-dd')) ?? []
  }, [choresByDay, selectedDay])

  const getMemberName = (uid: string) => {
    if (uid === 'everyone') return 'Tutti'
    return members.find((m) => m.uid === uid)?.displayName ?? 'N/A'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completato':
        return 'bg-green-500/20 border-green-500/40 text-green-400'
      case 'in_ritardo':
        return 'bg-red-500/20 border-red-500/40 text-red-400'
      default:
        return 'bg-primary/20 border-primary/40 text-primary'
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex w-16 flex-col items-center justify-center rounded-lg border border-primary/30 bg-card/50 p-1">
            <span className="text-xs uppercase text-primary">
              {format(today, 'MMM', { locale: it })}
            </span>
            <span className="text-lg font-bold text-primary">
              {format(today, 'd')}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">
              {format(firstDayCurrentMonth, 'MMMM yyyy', { locale: it })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(firstDayCurrentMonth, 'd MMM', { locale: it })} -{' '}
              {format(endOfMonth(firstDayCurrentMonth), 'd MMM yyyy', { locale: it })}
            </p>
          </div>
        </div>

        <div className="inline-flex -space-x-px rounded-lg shadow-sm">
          <Button
            onClick={() => setCurrentMonth(format(add(firstDayCurrentMonth, { months: -1 }), 'MMM-yyyy'))}
            variant="outline"
            size="icon"
            className="rounded-none first:rounded-s-lg"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setCurrentMonth(format(today, 'MMM-yyyy'))}
            variant="outline"
            className="rounded-none"
          >
            Oggi
          </Button>
          <Button
            onClick={() => setCurrentMonth(format(add(firstDayCurrentMonth, { months: 1 }), 'MMM-yyyy'))}
            variant="outline"
            size="icon"
            className="rounded-none last:rounded-e-lg"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar grid */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 text-center text-xs font-semibold border-b border-border">
              {dayNames.map((day) => (
                <div key={day} className="py-2.5 text-muted-foreground">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, dayIdx) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const dayChores = choresByDay.get(dayKey) ?? []
                const hasOverdue = dayChores.some((c) => c.status === 'in_ritardo')

                return (
                  <button
                    key={dayIdx}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      dayIdx === 0 && colStartClasses[getDay(day)],
                      !isSameMonth(day, firstDayCurrentMonth) && 'opacity-30',
                      'relative flex flex-col items-center border-b border-r border-border p-2 min-h-[80px] hover:bg-accent/30 transition-colors cursor-pointer',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-xs',
                        isEqual(day, selectedDay) && 'bg-primary text-primary-foreground',
                        !isEqual(day, selectedDay) && isToday(day) && 'border border-primary text-primary',
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayChores.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayChores.slice(0, 3).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              hasOverdue ? 'bg-destructive' : 'bg-primary'
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(selectedDay, "EEEE d MMMM", { locale: it })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDayChores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna attivita per questo giorno.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayChores.map((chore) => {
                  const Icon = getChoreIcon(chore.choreTypeIcon)
                  return (
                    <div
                      key={chore.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border text-sm',
                        getStatusColor(chore.status)
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{chore.choreTypeName}</p>
                        <p className="text-xs opacity-80">{getMemberName(chore.assignedTo)}</p>
                      </div>
                      {chore.status !== 'completato' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => completeChore(chore.id)}
                          title="Segna come completato"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
