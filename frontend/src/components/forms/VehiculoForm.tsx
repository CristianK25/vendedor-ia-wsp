import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Car, DollarSign, Gauge, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { vehiculosApi } from '../../api/vehiculos'
import type { VehiculoCreate } from '../../types/models'

// Extendemos VehiculoCreate para manejar las imagenes en el form
interface VehiculoFormData extends VehiculoCreate {
  imagenes_files?: File[]
}

export default function VehiculoForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para previsualizaciones de imagen
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const { register, handleSubmit, formState: { errors } } = useForm<VehiculoFormData>()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      
      setImagenes(prev => [...prev, ...filesArray])
      
      const newPreviews = filesArray.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removeImage = (index: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      // Liberar la URL de memoria
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const onSubmit = async (data: VehiculoFormData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Armamos el payload final
      const payload = {
        ...data,
        imagenes: imagenes // El API espera que el array de File vaya en esta propiedad
      }
      
      await vehiculosApi.create(payload)
      navigate('/vehiculos')
    } catch (err: any) {
      console.error('Error al guardar vehículo:', err)
      setError(err.message || 'Error al guardar el vehículo. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 md:px-10 py-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Car size={24} />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Registrar Vehículo</h1>
          <p className="text-on-surface-variant mt-1 text-sm md:text-base">Ingresa los datos y fotos del nuevo vehículo en stock.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium border border-error/20">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">Datos Principales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modelo */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Modelo y Año *</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  {...register('modelo', { required: 'El modelo es requerido' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Toyota Corolla 2022"
                />
              </div>
              {errors.modelo && <p className="text-error text-xs mt-1 font-medium">{errors.modelo.message}</p>}
            </div>

            {/* Precio */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Precio *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="number"
                  step="0.01"
                  {...register('precio', { 
                    required: 'El precio es requerido',
                    valueAsNumber: true,
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
              {errors.precio && <p className="text-error text-xs mt-1 font-medium">{errors.precio.message}</p>}
            </div>

            {/* Kilometraje */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Kilometraje *</label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="number"
                  {...register('kilometraje', { 
                    required: 'El kilometraje es requerido',
                    valueAsNumber: true,
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: 45000"
                />
              </div>
              {errors.kilometraje && <p className="text-error text-xs mt-1 font-medium">{errors.kilometraje.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">Detalles Adicionales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detalle Interior */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Interior</label>
              <textarea 
                {...register('detalle_interior')}
                className="w-full p-4 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[120px]"
                placeholder="Estado de los asientos, tablero, etc."
              />
            </div>

            {/* Detalle Exterior */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Exterior</label>
              <textarea 
                {...register('detalle_exterior')}
                className="w-full p-4 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[120px]"
                placeholder="Estado de la pintura, llantas, etc."
              />
            </div>

            {/* Información Extra */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Información Extra</label>
              <textarea 
                {...register('informacion_extra')}
                className="w-full p-4 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[100px]"
                placeholder="Cualquier otro detalle relevante (único dueño, servicios al día, etc.)..."
              />
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">Imágenes</h2>
          
          <div className="space-y-6">
            {/* Dropzone / Input file */}
            <div className="relative border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-background hover:bg-surface-variant/50 transition-colors cursor-pointer group">
              <ImageIcon className="text-outline mb-3 group-hover:text-primary transition-colors" size={32} />
              <p className="text-on-surface-variant font-medium">Haz clic aquí para seleccionar fotos</p>
              <p className="text-sm text-outline mt-1">Soporta JPG, PNG, WEBP</p>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-outline-variant bg-surface-container-high">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        type="button"
                        onClick={() => removeImage(index)}
                        className="w-10 h-10 bg-error text-on-error rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant mt-8">
          <button 
            type="button"
            onClick={() => navigate('/vehiculos')}
            className="px-6 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Guardar Vehículo'}
          </button>
        </div>
      </form>
    </div>
  )
}
