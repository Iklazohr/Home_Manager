import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboardIcon,
  CalendarIcon,
  ListChecksIcon,
  HomeIcon,
  UserIcon,
  BarChart3Icon,
  LogOutIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { href: '/calendario', label: 'Calendario', icon: CalendarIcon },
  { href: '/attivita', label: 'Attivita', icon: ListChecksIcon },
  { href: '/casa', label: 'Casa', icon: HomeIcon },
  { href: '/statistiche', label: 'Statistiche', icon: BarChart3Icon },
  { href: '/profilo', label: 'Profilo', icon: UserIcon },
]

export function NavBar() {
  const location = useLocation()
  const { logout, userProfile } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border lg:bg-card lg:min-h-screen lg:fixed lg:left-0 lg:top-0 lg:z-40">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <HomeIcon className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-primary">Home Manager</span>
          </div>
          <NotificationBell />
        </div>

        {userProfile && (
          <div className="px-6 py-3 border-b border-border">
            <p className="text-sm text-muted-foreground">Ciao,</p>
            <p className="text-sm font-semibold truncate">{userProfile.displayName}</p>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOutIcon className="h-4 w-4" />
            Esci
          </Button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1.5 py-1 text-[10px] transition-colors min-w-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
