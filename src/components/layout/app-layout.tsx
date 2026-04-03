import { Outlet } from 'react-router-dom'
import { NavBar } from '@/components/layout/nav-bar'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
