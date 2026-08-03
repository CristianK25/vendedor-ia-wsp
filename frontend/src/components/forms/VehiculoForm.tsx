import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  const { id } = useParams()
  const isEditMode = !!id

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para previsualizaciones de imagen (solo creacion)
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehiculoFormData>()

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true)
      vehiculosApi.getById(Number(id))
        .then(data => {
          reset(data)
          setLoading(false)
        })
        .catch(err => {
          console.error(err)
          setError('Error al cargar los datos del vehículo para edición.')
          setLoading(false)
        })
    }
  }, [id, isEditMode, reset])

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
      
      if (isEditMode) {
        // En modo edicion solo enviamos JSON normal
        const payloadToUpdate = {
          modelo: data.modelo,
          precio_venta: data.precio_venta,
          precio_compra: data.precio_compra,
          origen_compra: data.origen_compra,
          kilometraje: data.kilometraje,
          anio: data.anio,
          transmision: data.transmision,
          patente: data.patente,
          traccion: data.traccion,
          tipo: data.tipo,
          condicion: data.condicion,
          detalle_interior: data.detalle_interior,
          detalle_exterior: data.detalle_exterior,
          informacion_extra: data.informacion_extra
        }
        await vehiculosApi.update(Number(id), payloadToUpdate)
        navigate(`/vehiculos/${id}`)
      } else {
        // Armamos el payload final para crear (FormData)
        const payload = {
          ...data,
          imagenes: imagenes
        }
        await vehiculosApi.create(payload)
        navigate('/vehiculos')
      }
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
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
            {isEditMode ? 'Editar Vehículo' : 'Registrar Vehículo'}
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm md:text-base">
            {isEditMode ? 'Actualiza los datos del vehículo.' : 'Ingresa los datos y fotos del nuevo vehículo en stock.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium border border-error/20 shadow-lg animate-fade-in flex items-center justify-between gap-4 w-[calc(100%-3rem)] md:w-[400px]">
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-on-error-container/70 hover:text-on-error-container transition-colors shrink-0 p-1">
            <X size={18} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-12">
        <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">Datos Principales</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Modelo */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Modelo *</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  {...register('modelo', { required: 'El modelo es requerido' })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Toyota Corolla"
                />
              </div>
              {errors.modelo && <p className="text-error text-xs mt-1 font-medium">{errors.modelo.message}</p>}
            </div>

            {/* Año */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Año *</label>
              <div className="relative">
                <input 
                  type="number"
                  {...register('anio', { 
                    required: 'El año es requerido',
                    valueAsNumber: true,
                    min: { value: 1900, message: 'Año inválido' }
                  })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: 2022"
                />
              </div>
              {errors.anio && <p className="text-error text-xs mt-1 font-medium">{errors.anio.message}</p>}
            </div>

            {/* Patente */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Patente *</label>
              <div className="relative">
                <input 
                  {...register('patente', { required: 'La patente es requerida' })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all uppercase"
                  placeholder="Ej: AD123EF"
                />
              </div>
              {errors.patente && <p className="text-error text-xs mt-1 font-medium">{errors.patente.message}</p>}
            </div>

            {/* Transmisión */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Transmisión *</label>
              <div className="relative">
                <select
                  {...register('transmision', { required: 'La transmisión es requerida' })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value="Manual">Manual</option>
                  <option value="Automática">Automática</option>
                </select>
              </div>
              {errors.transmision && <p className="text-error text-xs mt-1 font-medium">{errors.transmision.message}</p>}
            </div>

            {/* Tracción */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Tracción *</label>
              <div className="relative">
                <select
                  {...register('traccion', { required: 'La tracción es requerida' })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value="4x2">4x2</option>
                  <option value="4x4">4x4</option>
                </select>
              </div>
              {errors.traccion && <p className="text-error text-xs mt-1 font-medium">{errors.traccion.message}</p>}
            </div>

            {/* Tipo */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Tipo *</label>
              <div className="relative">
                <select
                  {...register('tipo', { required: 'El tipo es requerido' })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value="Auto">Auto</option>
                  <option value="Camioneta">Camioneta</option>
                </select>
              </div>
              {errors.tipo && <p className="text-error text-xs mt-1 font-medium">{errors.tipo.message}</p>}
            </div>

            {/* Condición */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Condición *</label>
              <div className="relative">
                <select
                  {...register('condicion', { required: 'La condición es requerida' })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value="Usado">Usado</option>
                  <option value="Nuevo">Nuevo</option>
                </select>
              </div>
              {errors.condicion && <p className="text-error text-xs mt-1 font-medium">{errors.condicion.message}</p>}
            </div>

            {/* Origen de Compra */}
            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Origen de Compra *</label>
              <div className="relative">
                <select
                  {...register('origen_compra', { required: 'El origen de compra es requerido' })}
                  className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="">Seleccione...</option>
                  <option value="particular">Particular</option>
                  <option value="ri_factura_a">RI con Factura A</option>
                </select>
              </div>
              {errors.origen_compra && <p className="text-error text-xs mt-1 font-medium">{errors.origen_compra.message}</p>}
            </div>

            {/* Precio de Compra */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Precio de Compra *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="number"
                  step="0.01"
                  {...register('precio_compra', { 
                    required: 'El precio de compra es requerido',
                    valueAsNumber: true,
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
              {errors.precio_compra && <p className="text-error text-xs mt-1 font-medium">{errors.precio_compra.message}</p>}
            </div>

            {/* Precio de Venta */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2">Precio de Venta *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                <input 
                  type="number"
                  step="0.01"
                  {...register('precio_venta', { 
                    required: 'El precio de venta es requerido',
                    valueAsNumber: true,
                    min: { value: 0, message: 'No puede ser negativo' }
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
              {errors.precio_venta && <p className="text-error text-xs mt-1 font-medium">{errors.precio_venta.message}</p>}
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

        {!isEditMode && (
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
        )}

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant mt-8">
          <button 
            type="button"
            onClick={() => isEditMode ? navigate(`/vehiculos/${id}`) : navigate('/vehiculos')}
            className="px-6 py-3 rounded-xl font-medium text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95 shadow-sm"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isEditMode ? 'Actualizar Vehículo' : 'Guardar Vehículo')}
          </button>
        </div>
      </form>
    </div>
  )
}
