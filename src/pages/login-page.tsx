import { Link, Navigate } from 'react-router-dom'
import { HomeIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { LoginForm } from '@/components/auth/login-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BGPattern } from '@/components/ui/bg-pattern'

export function LoginPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <BGPattern variant="grid" mask="fade-edges" fill="#0a4a5c" size={32} />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <HomeIcon className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-primary">Home Manager</span>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-xl text-center">Accedi</CardTitle>
            <CardDescription className="text-center">
              Inserisci le tue credenziali per continuare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Non hai un account?{' '}
              <Link to="/registrati" className="text-primary hover:underline">
                Registrati
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
