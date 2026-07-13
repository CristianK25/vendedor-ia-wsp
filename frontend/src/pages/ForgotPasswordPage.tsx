import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Car, Mail, AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react'
import { fetchApi } from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)

    if (!email) {
      setStatus('error')
      setMessage('Por favor, ingresa tu correo electrónico')
      return
    }

    try {
      const response = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setStatus('success')
      setMessage(response.message || 'Si el correo existe, se ha enviado un enlace de recuperación.')
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || 'Ocurrió un error al procesar la solicitud.')
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
          <h1 className="text-2xl font-bold text-on-surface">Recuperar Contraseña</h1>
          <p className="text-sm text-on-surface-variant">Ingresa tu correo para recibir un enlace de recuperación</p>
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
              className="w-full bg-surface hover:bg-surface-variant text-on-surface py-3 rounded-xl font-semibold text-sm transition-all duration-200 border border-outline"
            >
              Volver al Login
            </button>
          </div>
        )}

        {/* Formulario */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            
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
                  disabled={status === 'loading'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline bg-background/50 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-primary hover:bg-primary-container text-white py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Enviando...</span>
                </>
              ) : (
                <span>Enviar enlace de recuperación</span>
              )}
            </button>

            <Link to="/login" className="flex items-center justify-center gap-1 text-sm text-primary hover:underline mt-2">
              <ArrowLeft size={16} />
              Volver al inicio de sesión
            </Link>
          </form>
        )}

      </div>
    </div>
  )
}
