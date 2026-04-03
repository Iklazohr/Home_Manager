import { useState, useMemo } from 'react'
import { BellIcon, XIcon } from 'lucide-react'
import type { Timestamp } from 'firebase/firestore'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { useChores } from '@/hooks/use-chores'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { chores } = useChores()

  const notifications = useMemo(() => {
    const now = new Date()
    return chores
      .filter((c) => c.status === 'in_ritardo' || c.status === 'in_attesa')
      .map((c) => {
        const due = (c.nextDueDate as Timestamp).toDate()
        const isOverdue = due < now
        return {
          id: c.id,
          title: c.choreTypeName,
          message: isOverdue
            ? `In ritardo! Scaduto ${formatDistanceToNow(due, { locale: it, addSuffix: true })}`
            : `Scadenza ${formatDistanceToNow(due, { locale: it, addSuffix: true })}`,
          isOverdue,
        }
      })
      .sort((a, b) => (a.isOverdue === b.isOverdue ? 0 : a.isOverdue ? -1 : 1))
      .slice(0, 10)
  }, [chores])

  const overdueCount = notifications.filter((n) => n.isOverdue).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(!open)}
      >
        <BellIcon className="h-5 w-5" />
        {overdueCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {overdueCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <span className="text-sm font-semibold">Notifiche</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <XIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  Nessuna notifica
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-3 border-b border-border last:border-0 text-sm',
                      n.isOverdue && 'bg-destructive/5'
                    )}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className={cn(
                      'text-xs',
                      n.isOverdue ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
