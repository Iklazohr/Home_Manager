import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Errore React:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold text-primary">Qualcosa e andato storto</h1>
            <p className="text-muted-foreground text-sm">
              {this.state.error?.message ?? 'Errore sconosciuto'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Ricarica la pagina
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
