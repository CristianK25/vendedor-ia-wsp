import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft, Loader2, Tag, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { clientesApi, etiquetasApi } from '../../api/clientes'
import PhoneInput from '../ui/PhoneInput'

export default function ClienteForm() {
  const navigate = useNavigate()
  
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [isPhoneValid, setIsPhoneValid] = useState(false)
  const [etiquetaId, setEtiquetaId] = useState<number | null>(null)
  
  const [etiquetas, setEtiquetas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    etiquetasApi.getAll().then((data: any) => setEtiquetas(data)).catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nombre.trim()) {
      setError('Por favor ingrese el nombre del cliente.')
      return
    }

    if (!telefono || !isPhoneValid) {
      setError('Por favor ingrese un número de teléfono válido de 10 dígitos (código de área + número local).')
      return
    }

    setLoading(true)
    setError(null)

    try {
      await clientesApi.create({
        nombre: nombre.trim(),
        telefono: telefono,
        etiqueta_id: etiquetaId || undefined
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/clientes')
      }, 1000)
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.detail || err.message || 'Error al registrar el cliente.')
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/clientes')}
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant cursor-pointer"
            title="Volver a Clientes"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <UserPlus size={22} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Registrar Nuevo Cliente</h1>
            <p className="text-on-surface-variant text-sm mt-0.5">Ingresa los datos para registrar un cliente en la base de datos y WhatsApp.</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium border border-error/20 shadow-sm flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 p-4 bg-secondary-container text-on-secondary-container rounded-2xl text-sm font-medium border border-primary/20 shadow-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="shrink-0 text-primary" size={20} />
          <span>¡Cliente registrado exitosamente! Redirigiendo...</span>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-xl space-y-6">
        
        {/* Campo: Nombre Completo */}
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold text-on-surface-variant mb-1.5">
            Nombre Completo <span className="text-primary">*</span>
          </label>
          <input 
            id="nombre"
            type="text" 
            required
            autoFocus
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base text-on-surface placeholder:text-on-surface-variant/50"
          />
        </div>

        {/* Campo: Teléfono con PhoneInput */}
        <div>
          <PhoneInput 
            id="telefono"
            label="Número de Teléfono (WhatsApp)"
            required
            value={telefono}
            onChange={(fullNumber, valid) => {
              setTelefono(fullNumber)
              setIsPhoneValid(valid)
            }}
            placeholder="261 472-0339"
          />
          <p className="text-xs text-on-surface-variant mt-1.5 opacity-80">
            💡 Ingresa el código de área + número local. Se guardará con el formato canónico internacional (+54 9) para integración automática con WhatsApp y n8n.
          </p>
        </div>

        {/* Campo: Etiqueta Opcional */}
        <div>
          <label htmlFor="etiqueta" className="block text-sm font-semibold text-on-surface-variant mb-1.5 flex items-center gap-1.5">
            <Tag size={16} className="text-primary" />
            Etiqueta Inicial <span className="text-xs font-normal text-on-surface-variant/70">(Opcional)</span>
          </label>
          <select
            id="etiqueta"
            value={etiquetaId || ''}
            onChange={e => setEtiquetaId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-on-surface cursor-pointer"
          >
            <option value="">Sin etiqueta</option>
            {etiquetas.map(etq => (
              <option key={etq.id} value={etq.id}>
                {etq.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
          <button 
            type="button"
            onClick={() => navigate('/clientes')}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading || !nombre.trim() || !telefono}
            className="px-7 py-3 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm cursor-pointer"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
            {loading ? 'Registrando...' : 'Registrar Cliente'}
          </button>
        </div>

      </form>
    </div>
  )
}
