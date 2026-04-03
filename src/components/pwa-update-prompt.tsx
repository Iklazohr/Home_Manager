import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { RefreshCwIcon } from 'lucide-react'

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-50 flex items-center gap-3 rounded-lg border border-primary/30 bg-card p-4 shadow-lg">
      <RefreshCwIcon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">Aggiornamento disponibile</p>
        <p className="text-xs text-muted-foreground">Una nuova versione e pronta</p>
      </div>
      <Button size="sm" onClick={() => updateServiceWorker(true)}>
        Aggiorna
      </Button>
    </div>
  )
}
