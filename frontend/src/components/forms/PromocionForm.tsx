import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Megaphone, Type, AlignLeft, Calendar, Loader2 } from 'lucide-react'
import { promocionesApi } from '../../api/promociones'
import type { PromocionCreate } from '../../types/models'

export default function PromocionForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<PromocionCreate>()

  const onSubmit = async (data: PromocionCreate) => {
    try {
      setLoading(true)
      setError(null)
      
      await promocionesApi.create(data)
      navigate('/promociones')
    } catch (err: any) {
      console.error('Error al crear promoción:', err)
      setError(err.message || 'Ocurrió un error al crear la promoción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Megaphone size={20} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Registrar Nueva Promoción</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">Detalles de la Promoción</h2>
          
          <div className="grid grid-cols-1 gap-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Título *</label>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="text"
                  {...register('titulo', { required: 'El título es requerido' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Descuento de Primavera"
                />
              </div>
              {errors.titulo && <p className="text-error text-xs mt-1 font-medium">{errors.titulo.message}</p>}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Descripción *</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-4 text-on-surface-variant" size={18} />
                <textarea 
                  {...register('descripcion', { required: 'La descripción es requerida' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[100px] resize-y"
                  placeholder="Detalles sobre las condiciones de la promoción..."
                />
              </div>
              {errors.descripcion && <p className="text-error text-xs mt-1 font-medium">{errors.descripcion.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha Inicio */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Fecha de Inicio *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    type="date"
                    {...register('fecha_inicio', { required: 'La fecha de inicio es requerida' })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                {errors.fecha_inicio && <p className="text-error text-xs mt-1 font-medium">{errors.fecha_inicio.message}</p>}
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Fecha de Fin *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    type="date"
                    {...register('fecha_fin', { required: 'La fecha de fin es requerida' })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                </div>
                {errors.fecha_fin && <p className="text-error text-xs mt-1 font-medium">{errors.fecha_fin.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/promociones')}
            className="px-6 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Promoción'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
