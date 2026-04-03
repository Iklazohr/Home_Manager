import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/auth-context'
import { HouseholdProvider } from '@/contexts/household-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { PWAUpdatePrompt } from '@/components/pwa-update-prompt'
import { ErrorBoundary } from '@/components/error-boundary'
import { LandingPage } from '@/pages/landing-page'
import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import { DashboardPage } from '@/pages/dashboard-page'
import { CalendarPage } from '@/pages/calendar-page'
import { ChoresPage } from '@/pages/chores-page'
import { HouseholdPage } from '@/pages/household-page'
import { ProfilePage } from '@/pages/profile-page'
import { StatsPage } from '@/pages/stats-page'

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
          <Routes>
            {/* Route pubbliche */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registrati" element={<RegisterPage />} />

            {/* Route protette */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/calendario" element={<CalendarPage />} />
              <Route path="/attivita" element={<ChoresPage />} />
              <Route path="/casa" element={<HouseholdPage />} />
              <Route path="/profilo" element={<ProfilePage />} />
              <Route path="/statistiche" element={<StatsPage />} />
            </Route>
          </Routes>
          <PWAUpdatePrompt />
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
