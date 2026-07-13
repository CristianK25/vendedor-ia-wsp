import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Car, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { fetchApi } from '../api/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Enlace de recuperación inválido o ausente.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)

    if (!token) {
      setStatus('error')
      setMessage('Enlace de recuperación inválido.')
      return
    }

    if (!password || !confirmPassword) {
      setStatus('error')
      setMessage('Por favor, completa todos los campos.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 6) {
      setStatus('error')
      setMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    try {
      const response = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password })
      })
      setStatus('success')
      setMessage(response.message || 'Contraseña actualizada exitosamente.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Ocurrió un error al restablecer la contraseña.')
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
          <h1 className="text-2xl font-bold text-on-surface">Nueva Contraseña</h1>
          <p className="text-sm text-on-surface-variant">Crea una nueva contraseña para tu cuenta</p>
        </div>

        {/* Mensajes */}
        {status === 'error' && (
          <div className="flex items-start gap-2 bg-error-container text-on-error-container p-3 rounded-lg border border-error/20 text-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={16} />
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2 bg-green-100 text-green-800 p-3 rounded-lg border border-green-200 text-sm">
              <CheckCircle className="shrink-0 mt-0.5" size={16} />
              <span>{message}</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        )}

        {/* Formulario */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">
                Nueva Contraseña
              </label>
              <div className="relative flex items-center w-full">
                <Lock className="absolute left-3 text-on-surface-variant" size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={status === 'loading' || !token}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-background/50 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="confirmPassword">
                Confirmar Contraseña
              </label>
              <div className="relative flex items-center w-full">
                <Lock className="absolute left-3 text-on-surface-variant" size={18} />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={status === 'loading' || !token}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-background/50 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading' || !token}
              className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Contraseña</span>
              )}
            </button>

            <div className="text-center mt-2">
              <Link to="/login" className="text-sm text-on-surface-variant hover:text-primary hover:underline transition-colors">
                Cancelar
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
