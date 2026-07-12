import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Si ya está autenticado, redirigir al calendario
    if (isAuthenticated) {
      navigate('/calendario', { replace: true })
    }
    return () => {
      clearError()
    }
  }, [isAuthenticated, navigate, clearError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email || !password) {
      setLocalError('Por favor, ingresa tu correo y contraseña')
      return
    }

    try {
      await login(email, password)
      navigate('/calendario', { replace: true })
    } catch (err: any) {
      // El error global del store ya se actualiza automáticamente
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-[440px] bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-8 flex flex-col gap-6">
        
        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Car size={28} />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">AutoGestor</h1>
          <p className="text-sm text-on-surface-variant">Inicia sesión para gestionar el CRM de vehículos</p>
        </div>

        {/* Mensajes de Error */}
        {(localError || error) && (
          <div className="flex items-start gap-2 bg-error-container text-on-error-container p-3 rounded-lg border border-error/20 text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{localError || error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          
          {/* Input Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="email">
              Correo Electrónico
            </label>
            <div className="relative flex items-center w-full">
              <Mail className="absolute left-3 text-on-surface-variant" size={18} />
              <input
                id="email"
                type="email"
                placeholder="admin@vendedor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-background/50 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Input Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
              Contraseña
            </label>
            <div className="relative flex items-center w-full">
              <Lock className="absolute left-3 text-on-surface-variant" size={18} />
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-background/50 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Botón de Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </button>

        </form>

      </div>
    </div>
  )
}
