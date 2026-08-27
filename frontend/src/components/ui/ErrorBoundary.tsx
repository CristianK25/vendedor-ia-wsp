import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  isChunkError: boolean;
}

function getUserEmail(): string | undefined {
  try {
    const raw = localStorage.getItem('foodstore-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.state?.usuario?.email
    }
  } catch {
    // Ignorar errores de lectura en localStorage
  }
  return undefined
}

function sendErrorToBackend(error: Error, errorInfo?: ErrorInfo | null) {
  try {
    const payload = {
      error_name: error?.name || 'Error',
      error_message: error?.message || error?.toString() || 'Error desconocido',
      component_stack: errorInfo?.componentStack || null,
      url: window.location.href,
      user_agent: navigator.userAgent,
      user_email: getUserEmail()
    }

    fetch('/api/logs/frontend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vendedoria-crm-vehiculos': 'true'
      },
      body: JSON.stringify(payload)
    }).catch(() => {
      // Silencioso para evitar bucles si no hay conexión
    })
  } catch {
    // Silencioso
  }
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    isChunkError: false
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkError = 
      error?.name === 'ChunkLoadError' || 
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('failed to fetch dynamically imported module')

    return { 
      hasError: true, 
      error,
      isChunkError
    }
  }

  public componentDidMount() {
    // Permite probar el Error Boundary desde la Consola F12 escribiendo: simularError()
    (window as any).simularError = (mensaje?: string) => {
      const testError = new Error(mensaje || '¡Error de prueba simulado desde la Consola F12!')
      sendErrorToBackend(testError, null)
      this.setState({
        hasError: true,
        error: testError,
        isChunkError: false
      })
    }
  }

  public componentWillUnmount() {
    delete (window as any).simularError
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo)
    sendErrorToBackend(error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    // Forzar recarga ignorando la caché del navegador
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      isChunkError: false
    })
  }

  public render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Ocurrió un problema al cargar esta vista' } = this.props
      const { error, errorInfo, showDetails, isChunkError } = this.state

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-4 md:p-8 animate-fade-in">
          <div className="w-full max-w-2xl bg-surface-container-high border border-outline-variant/60 rounded-2xl p-6 md:p-8 shadow-xl text-on-surface">
            {/* Header / Icon */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-error-container/20 text-error flex items-center justify-center shrink-0 border border-error/20">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">
                  {isChunkError ? 'Nueva versión disponible' : fallbackTitle}
                </h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {isChunkError 
                    ? 'Se actualizó la aplicación. Por favor, recarga para obtener la última versión sin errores.'
                    : 'Un componente de la interfaz experimentó una falla inesperada.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-all text-sm shadow-sm cursor-pointer"
              >
                <RefreshCw size={16} className="animate-spin-slow" />
                Actualizar Versión (Limpiar Caché)
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-outline-variant/30 transition-all text-sm border border-outline-variant cursor-pointer"
              >
                <RotateCcw size={16} />
                Reintentar Vista
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-4 py-2.5 bg-transparent text-on-surface-variant font-medium rounded-xl hover:bg-surface-container-highest transition-all text-sm cursor-pointer"
              >
                <Home size={16} />
                Ir al Inicio
              </button>
            </div>

            {/* Technical details toggle */}
            {error && (
              <div className="border-t border-outline-variant/40 pt-4">
                <button
                  onClick={() => this.setState({ showDetails: !showDetails })}
                  className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  <span>{showDetails ? 'Ocultar detalles técnicos' : 'Ver detalles técnicos del error'}</span>
                </button>

                {showDetails && (
                  <div className="mt-3 p-4 bg-background/80 border border-outline-variant/40 rounded-xl text-xs font-mono text-error overflow-x-auto space-y-2">
                    <p className="font-bold">{error.toString()}</p>
                    {errorInfo && (
                      <pre className="text-[11px] text-on-surface-variant/80 whitespace-pre-wrap leading-relaxed">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
