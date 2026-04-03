import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'
import { motion } from 'framer-motion'
import {
  BellIcon,
  CheckCircle2Icon,
  CalendarIcon,
  HomeIcon,
  UsersIcon,
  TrendingUpIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BGPattern } from '@/components/ui/bg-pattern'

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-start gap-4 p-6 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex flex-col">
        <h3 className="text-lg font-bold leading-none tracking-tight text-primary">
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

const features = [
  {
    icon: BellIcon,
    title: 'Notifiche Intelligenti',
    description: 'Ricevi promemoria puntuali per le attivita in scadenza e non dimenticare mai nulla.',
  },
  {
    icon: CalendarIcon,
    title: 'Programmazione Flessibile',
    description: 'Imposta attivita con frequenze personalizzate: settimanale, mensile, trimestrale o annuale.',
  },
  {
    icon: UsersIcon,
    title: 'Profili Multi-Utente',
    description: 'Collega piu utenti alla stessa casa e tieni traccia di chi fa cosa.',
  },
  {
    icon: CheckCircle2Icon,
    title: 'Assegnazione Compiti',
    description: 'Assegna attivita specifiche ai membri della famiglia e monitora lo stato.',
  },
  {
    icon: TrendingUpIcon,
    title: 'Statistiche e Analisi',
    description: 'Visualizza statistiche dettagliate su completamenti, ritardi e produttivita.',
  },
  {
    icon: HomeIcon,
    title: 'Gestione Casa',
    description: 'Dashboard centralizzata per tutte le attivita e faccende domestiche.',
  },
]

export function LandingPage() {
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
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <BGPattern variant="grid" mask="fade-edges" fill="#0a4a5c" size={32} />

      <div className="relative z-10">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-4 bg-primary/20 text-primary border border-primary/30">
              Gestione Domestica Semplificata
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-primary tracking-tight">
              Home Manager
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
              {'>'} Organizza le faccende di casa con programmazione intelligente, notifiche e collaborazione di squadra
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild className="text-lg px-8 py-6">
                <Link to="/registrati">Inizia Ora</Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-card/50 text-lg px-8 py-6">
                <Link to="/login">Accedi</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-primary">
              {'>'} Funzionalita
            </h2>
            <p className="text-center text-muted-foreground mb-12">
              Tutto cio che serve per gestire la casa in modo efficiente
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">
              {'>'} Pronto a semplificare la gestione della tua casa?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Unisciti a Home Manager e vivi una gestione domestica senza stress
            </p>
            <Button asChild className="text-lg px-8 py-6">
              <Link to="/registrati">Crea Account Gratuito</Link>
            </Button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
