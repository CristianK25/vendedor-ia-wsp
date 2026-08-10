import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Car, DollarSign, Gauge, Image as ImageIcon, X, Loader2, UserPlus, Search } from 'lucide-react'
import { vehiculosApi } from '../../api/vehiculos'
import { clientesApi } from '../../api/clientes'
import type { VehiculoCreate } from '../../types/models'

// Extendemos VehiculoCreate para manejar las imagenes en el form
interface VehiculoFormData extends VehiculoCreate {
  imagenes_files?: File[]
}

import DocumentacionStepForm from './DocumentacionStepForm'

export default function VehiculoForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [activeTab, setActiveTab] = useState<'datos' | 'documentos'>('datos')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [imagenes, setImagenes] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [previewErrors, setPreviewErrors] = useState<Record<number, boolean>>({})
  
  const [archivosPendientes, setArchivosPendientes] = useState<Record<string, { file: File, etapa: string }>>({})
  const [localEtapaIndex, setLocalEtapaIndex] = useState(0)

  // Estados del Módulo de Consignación
  const [tipoAlta, setTipoAlta] = useState<'compra_directa' | 'consignacion'>('compra_directa')
  const [comisionTipo, setComisionTipo] = useState<'porcentaje' | 'monto_fijo'>('porcentaje')
  const [duenoTelefono, setDuenoTelefono] = useState('')
  const [duenoNombre, setDuenoNombre] = useState('')
  const [duenoSearch, setDuenoSearch] = useState('')
  const [duenoSearchResults, setDuenoSearchResults] = useState<any[]>([])
  const [isNewDueno, setIsNewDueno] = useState(false)
  const [newDuenoData, setNewDuenoData] = useState({ telefono: '', nombre: '' })

  const handleArchivoPendienteChange = (tipo: string, file: File | null, etapa?: string) => {
    setArchivosPendientes(prev => {
      const updated = { ...prev }
      if (file && etapa) {
        updated[tipo] = { file, etapa }
      } else {
        delete updated[tipo]
      }
      return updated
    })
  }

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehiculoFormData>()

  useEffect(() => {
    if (duenoSearch.length > 2 && !isNewDueno) {
      clientesApi.getAll(1, 10, duenoSearch).then((data: any) => {
        setDuenoSearchResults(data.items)
      }).catch(err => console.error(err))
    } else {
      setDuenoSearchResults([])
    }
  }, [duenoSearch, isNewDueno])

  useEffect(() => {
    if (isEditMode && id) {
      setLoading(true)
      vehiculosApi.getById(Number(id))
        .then(data => {
          reset(data)
          if (data.tipo_alta) {
            setTipoAlta(data.tipo_alta)
          }
          if (data.comision_tipo) {
            setComisionTipo(data.comision_tipo)
          }
          if (data.dueno_telefono) {
            setDuenoTelefono(data.dueno_telefono)
            clientesApi.getAll(1, 5, data.dueno_telefono).then((res: any) => {
              if (res.items && res.items.length > 0) {
                const matched = res.items.find((c: any) => c.telefono === data.dueno_telefono)
                setDuenoNombre(matched ? matched.nombre : data.dueno_telefono)
              } else {
                setDuenoNombre(data.dueno_telefono)
              }
            }).catch(() => setDuenoNombre(data.dueno_telefono))
          }
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
    setPreviewErrors(prev => {
      const updated = { ...prev }
      delete updated[index]
      
      const remapped: Record<number, boolean> = {}
      Object.keys(updated).forEach(keyStr => {
        const k = Number(keyStr)
        if (k > index) {
          remapped[k - 1] = updated[k]
        } else {
          remapped[k] = updated[k]
        }
      })
      return remapped
    })
  }


  const onSubmit = async (data: VehiculoFormData) => {
    try {
      setLoading(true)
      setError(null)

      let finalDuenoTelefono = duenoTelefono
      if (tipoAlta === 'consignacion') {
        if (isNewDueno) {
          if (!newDuenoData.telefono || !newDuenoData.nombre) {
            throw new Error('Por favor complete los datos del dueño del vehículo.')
          }
          await clientesApi.create(newDuenoData)
          finalDuenoTelefono = newDuenoData.telefono
        }
        if (!finalDuenoTelefono) {
          throw new Error('Por favor seleccione o registre un dueño para el vehículo en consignación.')
        }
      }

      const cleanData = {
        marca: data.marca,
        modelo: data.modelo,
        precio_venta: data.precio_venta,
        kilometraje: data.kilometraje,
        anio: data.anio,
        transmision: data.transmision,
        patente: data.patente,
        traccion: data.traccion,
        tipo: data.tipo,
        condicion: data.condicion,
        detalle_interior: data.detalle_interior,
        detalle_exterior: data.detalle_exterior,
        informacion_extra: data.informacion_extra,
        tipo_alta: tipoAlta,
        precio_compra: tipoAlta === 'compra_directa' ? data.precio_compra : null,
        origen_compra: tipoAlta === 'compra_directa' ? data.origen_compra : null,
        dueno_telefono: tipoAlta === 'consignacion' ? finalDuenoTelefono : null,
        precio_acordado: tipoAlta === 'consignacion' ? data.precio_acordado : null,
        comision_tipo: tipoAlta === 'consignacion' ? comisionTipo : null,
        comision_valor: tipoAlta === 'consignacion' ? data.comision_valor : null,
      }
      
      if (isEditMode) {
        // En modo edicion solo enviamos JSON normal
        await vehiculosApi.update(Number(id), cleanData)
        navigate(`/vehiculos/${id}`)
      } else {
        // Armamos el payload final para crear (FormData)
        const payload = {
          ...cleanData,
          imagenes: imagenes
        }
        const nuevoVehiculo = await vehiculosApi.create(payload)
        
        // Subimos los documentos pendientes si hay alguno
        const uploadPromises = Object.entries(archivosPendientes).map(([tipo, docData]) => {
          return vehiculosApi.subirDocumento(nuevoVehiculo.id, docData.etapa, tipo, docData.file)
        })
        
        if (uploadPromises.length > 0) {
          await Promise.all(uploadPromises)
        }
        
        // El backend avanzará automáticamente las etapas al detectar que los requisitos se cumplen
        
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

      {/* Tabs - Solo se muestran en modo creación */}
      {!isEditMode && (
        <div className="flex items-center gap-4 border-b border-outline-variant mb-8 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'datos'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
            }`}
          >
            Datos Principales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'documentos'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
            }`}
          >
            Documentación
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="pb-12 animate-fade-in">
        <div className={isEditMode || activeTab === 'datos' ? 'block space-y-8' : 'hidden'}>
          {/* 1. Bloque: Condiciones de Ingreso */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">1. Condiciones de Ingreso (Datos Comerciales)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Alta Selector */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Tipo de Alta</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    disabled={isEditMode}
                    onClick={() => setTipoAlta('compra_directa')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                      tipoAlta === 'compra_directa'
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background border-outline-variant text-on-surface-variant hover:border-outline'
                    } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    Compra Directa
                  </button>
                  <button
                    type="button"
                    disabled={isEditMode}
                    onClick={() => setTipoAlta('consignacion')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all flex items-center justify-center gap-2 ${
                      tipoAlta === 'consignacion'
                        ? 'bg-primary/10 border-primary text-primary shadow-sm'
                        : 'bg-background border-outline-variant text-on-surface-variant hover:border-outline'
                    } ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    Consignación
                  </button>
                </div>
              </div>

              {/* Campos condicionales según Tipo de Alta */}
              {tipoAlta === 'compra_directa' ? (
                <>
                  {/* Origen de Compra */}
                  <div className="col-span-1 md:col-span-1">
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Origen de Compra</label>
                    <div className="relative">
                      <select
                        {...register('origen_compra', { required: tipoAlta === 'compra_directa' ? 'El origen de compra es requerido' : false })}
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
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Precio de Compra</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                      <input 
                        type="number"
                        step="0.01"
                        {...register('precio_compra', { 
                          required: tipoAlta === 'compra_directa' ? 'El precio de compra es requerido' : false,
                          valueAsNumber: true,
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.precio_compra && <p className="text-error text-xs mt-1 font-medium">{errors.precio_compra.message}</p>}
                  </div>
                </>
              ) : (
                <>
                  {/* Dueño del Vehículo */}
                  <div className="col-span-1 md:col-span-2 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-on-surface">Datos del Dueño del Vehículo</h3>
                      {!isEditMode && (
                        <button 
                          type="button"
                          onClick={() => setIsNewDueno(!isNewDueno)}
                          className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
                        >
                          {isNewDueno ? 'Buscar Existente' : <><UserPlus size={16} /> Nuevo Cliente</>}
                        </button>
                      )}
                    </div>

                    {isNewDueno ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-on-surface-variant mb-1">Nombre Completo</label>
                          <input 
                            type="text" 
                            required
                            value={newDuenoData.nombre}
                            onChange={e => setNewDuenoData({...newDuenoData, nombre: e.target.value})}
                            className="w-full h-11 px-3 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-on-surface-variant mb-1">Teléfono (ID)</label>
                          <input 
                            type="text" 
                            required
                            value={newDuenoData.telefono}
                            onChange={e => setNewDuenoData({...newDuenoData, telefono: e.target.value})}
                            className="w-full h-11 px-3 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {duenoTelefono ? (
                          <div className="flex items-center justify-between bg-primary-container text-on-primary-container p-3 rounded-lg border border-primary/20">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                              <div>
                                <p className="font-semibold text-sm">{duenoNombre}</p>
                                <p className="text-xs opacity-80">{duenoTelefono}</p>
                              </div>
                            </div>
                            {!isEditMode && (
                              <button 
                                type="button" 
                                onClick={() => { setDuenoTelefono(''); setDuenoNombre(''); }}
                                className="text-xs uppercase font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded"
                              >
                                Cambiar
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                            <input 
                              type="text" 
                              placeholder="Buscar dueño por nombre o teléfono..." 
                              value={duenoSearch}
                              onChange={e => setDuenoSearch(e.target.value)}
                              className="w-full pl-10 pr-4 h-11 bg-background border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                            />
                            
                            {duenoSearchResults.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {duenoSearchResults.map(client => (
                                  <div 
                                    key={client.telefono}
                                    onClick={() => {
                                      setDuenoTelefono(client.telefono);
                                      setDuenoNombre(client.nombre || client.telefono);
                                      setDuenoSearch('');
                                    }}
                                    className="p-3 hover:bg-surface-container-low cursor-pointer border-b border-outline-variant last:border-0"
                                  >
                                    <p className="font-semibold text-sm text-on-surface">{client.nombre}</p>
                                    <p className="text-xs text-on-surface-variant">{client.telefono}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comisión Tipo y Valor */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Comisión de la Agencia</label>
                    <div className="space-y-2">
                      <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
                        <button
                          type="button"
                          onClick={() => setComisionTipo('porcentaje')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                            comisionTipo === 'porcentaje'
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          Porcentaje (%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setComisionTipo('monto_fijo')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                            comisionTipo === 'monto_fijo'
                              ? 'bg-primary text-on-primary shadow-sm'
                              : 'text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          Monto Fijo ($)
                        </button>
                      </div>
                      <div className="relative">
                        {comisionTipo === 'monto_fijo' && (
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                        )}
                        <input 
                          type="number"
                          step="0.01"
                          {...register('comision_valor', { 
                            required: tipoAlta === 'consignacion' ? 'El valor de comisión es requerido' : false,
                            valueAsNumber: true,
                            min: { value: 0, message: 'No puede ser negativo' }
                          })}
                          className={`w-full py-3 pr-4 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                            comisionTipo === 'monto_fijo' ? 'pl-10' : 'pl-4 hide-spin-buttons'
                          }`}
                          placeholder={comisionTipo === 'porcentaje' ? 'Ej: 5' : 'Ej: 1000'}
                        />
                        {comisionTipo === 'porcentaje' && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">%</span>
                        )}
                      </div>
                    </div>
                    {errors.comision_valor && <p className="text-error text-xs mt-1 font-medium">{errors.comision_valor.message}</p>}
                  </div>

                  {/* Precio Acordado */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-on-surface-variant mb-2">Precio Acordado con Dueño</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                      <input 
                        type="number"
                        step="0.01"
                        {...register('precio_acordado', { 
                          required: tipoAlta === 'consignacion' ? 'El precio acordado es requerido' : false,
                          valueAsNumber: true,
                          min: { value: 0, message: 'No puede ser negativo' }
                        })}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.precio_acordado && <p className="text-error text-xs mt-1 font-medium">{errors.precio_acordado.message}</p>}
                  </div>
                </>
              )}

              {/* Precio de Venta al Público - OCUPA DOS COLUMNAS COMO CIERRE DEL BLOQUE */}
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-outline-variant mt-2">
                <label className="block text-sm font-bold text-on-surface mb-2">Precio de Venta (Publicación)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={20} />
                  <input 
                    type="number"
                    step="0.01"
                    {...register('precio_venta', { 
                      required: 'El precio de venta es requerido',
                      valueAsNumber: true,
                      min: { value: 0, message: 'No puede ser negativo' }
                    })}
                    className="w-full pl-10 pr-4 py-4 bg-primary/5 border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-lg font-bold text-on-surface"
                    placeholder="0.00"
                  />
                </div>
                {errors.precio_venta && <p className="text-error text-xs mt-1 font-medium">{errors.precio_venta.message}</p>}
              </div>
            </div>
          </div>

          {/* 2. Bloque: Características del Vehículo */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">2. Características del Vehículo (Datos Técnicos)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Marca */}
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Marca</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    {...register('marca', { required: 'La marca es requerida' })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Ej: Toyota"
                  />
                </div>
                {errors.marca && <p className="text-error text-xs mt-1 font-medium">{errors.marca.message}</p>}
              </div>

              {/* Modelo */}
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Modelo</label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                  <input 
                    {...register('modelo', { required: 'El modelo es requerido' })}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="Ej: Corolla"
                  />
                </div>
                {errors.modelo && <p className="text-error text-xs mt-1 font-medium">{errors.modelo.message}</p>}
              </div>

              {/* Año */}
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Año</label>
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
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Patente</label>
                <div className="relative">
                  <input 
                    {...register('patente', { required: 'La patente es requerida' })}
                    className="w-full px-4 py-3 bg-background border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all uppercase"
                    placeholder="Ej: AD123EF"
                  />
                </div>
                {errors.patente && <p className="text-error text-xs mt-1 font-medium">{errors.patente.message}</p>}
              </div>

              {/* Kilometraje */}
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Kilometraje</label>
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

              {/* Transmisión */}
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Transmisión</label>
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
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Tracción</label>
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
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Tipo</label>
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
                <label className="block text-sm font-medium text-on-surface-variant mb-2">Condición</label>
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
            </div>
          </div>

          {/* 3. Bloque: Detalles Adicionales */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-on-surface mb-6 border-b border-outline-variant pb-2">3. Detalles Adicionales (Descripciones)</h2>
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
                <p className="text-sm text-outline mt-1">Soporta JPG, PNG, WEBP, HEIC (iPhone)</p>
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
                  {previews.map((preview, index) => {
                    const isError = previewErrors[index];
                    const isHEIC = imagenes[index] && (
                      imagenes[index].name.toLowerCase().endsWith('.heic') ||
                      imagenes[index].name.toLowerCase().endsWith('.heif')
                    );
                    
                    return (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-outline-variant bg-surface-container-high flex flex-col items-center justify-center p-2 text-center">
                        {isError ? (
                          <div className="flex flex-col items-center justify-center h-full w-full p-3 bg-gradient-to-br from-surface-container-low to-surface-container-high">
                            <ImageIcon className="text-primary/70 mb-2 shrink-0 animate-pulse" size={28} />
                            <span className="text-[11px] font-semibold text-on-surface line-clamp-1 break-all px-1">
                              {imagenes[index]?.name}
                            </span>
                            <span className="text-[9px] text-on-surface-variant font-medium mt-1 leading-normal">
                              {isHEIC 
                                ? 'Imagen HEIC (se convertirá a WebP al guardar)' 
                                : 'Formato no soportado en este navegador (se convertirá al guardar)'
                              }
                            </span>
                          </div>
                        ) : (
                          <img 
                            src={preview} 
                            alt={`Preview ${index}`} 
                            className="w-full h-full object-cover" 
                            onError={() => {
                              setPreviewErrors(prev => ({ ...prev, [index]: true }));
                            }}
                          />
                        )}
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
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        </div>
        
        {!isEditMode && (
          <div className={activeTab === 'documentos' ? 'block' : 'hidden'}>
            <DocumentacionStepForm 
              vehiculoId={id ? Number(id) : undefined}
              isNewMode={!isEditMode}
              archivosPendientes={archivosPendientes}
              onArchivoPendienteChange={handleArchivoPendienteChange}
              localEtapaIndex={localEtapaIndex}
              onAvanzarEtapaLocal={() => setLocalEtapaIndex(prev => prev + 1)}
            />
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
