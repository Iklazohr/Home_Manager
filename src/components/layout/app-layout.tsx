import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { NavBar } from '@/components/layout/nav-bar'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { useLocalNotifications } from '@/hooks/use-local-notifications'

export function AppLayout() {
  const location = useLocation()
  usePushNotifications()
  useLocalNotifications()

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
