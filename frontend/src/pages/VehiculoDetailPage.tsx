import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vehiculosApi } from '../api/vehiculos'
import { clientesApi } from '../api/clientes'
import { 
  ArrowLeft, Edit2, CheckCircle2, 
  FileText,
  ImageOff, ChevronLeft, ChevronRight, UserCircle2, ShieldCheck,
  Lock, AlertTriangle, ExternalLink, FileCheck2, UploadCloud
} from 'lucide-react'

const ETAPAS = [
  { id: 'pre_compra', label: 'Pre-compra' },
  { id: 'comprado', label: 'Comprado' },
  { id: 'en_stock', label: 'En Stock' },
  { id: 'vendido', label: 'Vendido' }
]

const DOCS_POR_ETAPA: Record<string, { id: string, label: string, optional?: boolean }[]> = {
  pre_compra: [
    { id: 'informe_dominio', label: 'Informe de Dominio' },
    { id: 'deuda_patentes', label: 'Deuda de Patentes' }
  ],
  comprado: [
    { id: 'boleto_compra', label: 'Boleto de Compra' },
    { id: 'dni_vendedor', label: 'DNI Vendedor' },
    { id: 'cedula_vehiculo', label: 'Cédula Vehículo' },
    { id: 'formulario_08', label: 'Formulario 08' }
  ],
  en_stock: [
    { id: 'contrato_consignacion', label: 'Contrato Consignación (Opcional)', optional: true }
  ],
  vendido: [
    { id: 'boleto_venta', label: 'Boleto de Venta' },
    { id: 'verificacion_policial', label: 'Verificación Policial' },
    { id: 'dni_comprador', label: 'DNI Comprador' },
    { id: 'formulario_08_12', label: 'Formulario 08/12' }
  ]
}

export default function VehiculoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [vehiculo, setVehiculo] = useState<any>(null)
  const [documentos, setDocumentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [duenoNombre, setDuenoNombre] = useState<string | null>(null)
  
  // Galería
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (!id) return
    
    setLoading(true)
    Promise.all([
      vehiculosApi.getById(Number(id)),
      vehiculosApi.getDocumentos(Number(id))
    ])
      .then(([vehiculoData, documentosData]) => {
        setVehiculo(vehiculoData)
        setDocumentos(documentosData)
        
        if (vehiculoData.dueno_telefono) {
          clientesApi.getAll(1, 5, vehiculoData.dueno_telefono).then((res: any) => {
            if (res.items && res.items.length > 0) {
              const matched = res.items.find((c: any) => c.telefono === vehiculoData.dueno_telefono)
              setDuenoNombre(matched ? matched.nombre : vehiculoData.dueno_telefono)
            } else {
              setDuenoNombre(vehiculoData.dueno_telefono)
            }
          }).catch(() => setDuenoNombre(vehiculoData.dueno_telefono))
        }
        
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('No se pudo cargar el vehículo.')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return <div className="p-10 text-on-surface-variant flex items-center justify-center">Cargando detalles del vehículo...</div>
  }

  if (error || !vehiculo) {
    return (
      <div className="p-10 text-center">
        <p className="text-error mb-4">{error || 'Vehículo no encontrado'}</p>
        <button onClick={() => navigate('/vehiculos')} className="text-primary hover:underline">
          Volver al catálogo
        </button>
      </div>
    )
  }

  const hasImages = vehiculo.imagenes && vehiculo.imagenes.length > 0;
  
  const handlePrevImage = () => {
    setActiveImageIndex(prev => prev === 0 ? vehiculo.imagenes.length - 1 : prev - 1)
  }

  const handleNextImage = () => {
    setActiveImageIndex(prev => prev === vehiculo.imagenes.length - 1 ? 0 : prev + 1)
  }

  return (
    <div className="px-4 md:px-10 py-8 max-w-[1200px] mx-auto animate-fade-in w-full">
      {/* Navegación y Acciones Superiores */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/vehiculos')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium text-sm"
        >
          <ArrowLeft size={18} />
          Volver a resultados
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/vehiculos/${vehiculo.id}/documentacion`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-primary-container transition-colors shadow-sm"
          >
            <UploadCloud size={16} />
            Subir Documentos
          </button>
          <button 
            onClick={() => navigate(`/vehiculos/editar/${vehiculo.id}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container-low transition-colors text-on-surface"
          >
            <Edit2 size={16} />
            Editar
          </button>
        </div>
      </div>

      {/* Cabecera Principal */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-on-surface leading-tight mb-2">
            {vehiculo.modelo}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-primary font-bold text-4xl mb-1">${vehiculo.precio_venta.toLocaleString()}</div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${vehiculo.estado === 'disponible' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : vehiculo.estado === 'reventa' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            <CheckCircle2 size={14} />
            {vehiculo.estado === 'disponible' ? 'Disponible para la Venta' : vehiculo.estado === 'reventa' ? 'Vendido (Reventa)' : 'Vendido'}
          </div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Galería y Datos */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Galería (Carrusel) */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-4 overflow-hidden">
            <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl bg-surface-container overflow-hidden flex items-center justify-center mb-3">
              {hasImages ? (
                <>
                  <img 
                    src={vehiculo.imagenes[activeImageIndex].ruta} 
                    alt={vehiculo.modelo} 
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  {vehiculo.imagenes.length > 1 && (
                    <>
                      <button onClick={handlePrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm">
                        <ChevronLeft size={24} />
                      </button>
                      <button onClick={handleNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors backdrop-blur-sm">
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                        {activeImageIndex + 1} / {vehiculo.imagenes.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-outline">
                  <ImageOff size={48} className="mb-2 opacity-50" />
                  <span className="text-sm font-medium opacity-70">Sin imágenes</span>
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {hasImages && vehiculo.imagenes.length > 1 && (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar snap-x pb-1">
                {vehiculo.imagenes.map((img: any, idx: number) => (
                  <button 
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 snap-start transition-all ${activeImageIndex === idx ? 'border-primary shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img 
                      src={img.ruta} 
                      alt="thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tarjeta: Identificación y Estado */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-on-surface mb-4 border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/80"></span> 
              Identificación y Estado
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">ID Referencia</span>
                <span className="font-semibold text-on-surface">#{vehiculo.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Patente</span>
                <span className="font-semibold text-on-surface uppercase">{vehiculo.patente}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Estado</span>
                <span className="font-semibold text-on-surface capitalize">{vehiculo.estado}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Condición</span>
                <span className="font-semibold text-on-surface">{vehiculo.condicion || '-'}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta: Especificaciones Técnicas */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-on-surface mb-4 border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/80"></span> 
              Especificaciones Técnicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Tipo</span>
                <span className="font-semibold text-on-surface">{vehiculo.tipo || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Año</span>
                <span className="font-semibold text-on-surface">{vehiculo.anio}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Kilometraje</span>
                <span className="font-semibold text-on-surface">{vehiculo.kilometraje.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Transmisión</span>
                <span className="font-semibold text-on-surface">{vehiculo.transmision}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Tracción</span>
                <span className="font-semibold text-on-surface">{vehiculo.traccion || '-'}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta: Información Comercial */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-on-surface mb-4 border-b border-outline-variant pb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/80"></span> 
              Información Comercial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Tipo de Alta</span>
                <span className="font-semibold text-on-surface capitalize">
                  {vehiculo.tipo_alta === 'consignacion' ? 'Consignación' : 'Compra Directa'}
                </span>
              </div>
              {vehiculo.tipo_alta === 'consignacion' ? (
                <>
                  <div className="flex justify-between py-2 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">Dueño del auto</span>
                    <span className="font-semibold text-on-surface">
                      {duenoNombre || vehiculo.dueno_telefono || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">Precio acordado</span>
                    <span className="font-semibold text-on-surface">
                      ${vehiculo.precio_acordado?.toLocaleString() || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">Comisión</span>
                    <span className="font-semibold text-on-surface">
                      {vehiculo.comision_valor ? (
                        vehiculo.comision_tipo === 'porcentaje' 
                          ? `${vehiculo.comision_valor}%`
                          : `$${vehiculo.comision_valor.toLocaleString()}`
                      ) : '-'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between py-2 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">Origen de compra</span>
                    <span className="font-semibold text-on-surface capitalize">
                      {vehiculo.origen_compra === 'ri_factura_a' ? 'RI con Factura A' : 'Particular'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-outline-variant/30">
                    <span className="text-on-surface-variant">Precio de compra</span>
                    <span className="font-semibold text-on-surface">
                      ${vehiculo.precio_compra?.toLocaleString() || '-'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Documentos del Vehículo */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-outline-variant pb-3">
              <h3 className="text-xl font-semibold text-on-surface flex items-center gap-2">
                <FileText size={20} className="text-primary"/>
                Documentos del Vehículo
              </h3>
              <button 
                onClick={() => navigate(`/vehiculos/${vehiculo.id}/documentacion`)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors"
              >
                <UploadCloud size={16} />
                Gestionar
              </button>
            </div>
            
            <div className="space-y-6">
              {ETAPAS.map((etapa, idx) => {
                const currentEtapaIndex = ETAPAS.findIndex(e => e.id === (vehiculo.etapa || 'pre_compra'))
                const isCurrent = idx === currentEtapaIndex
                const isCompleted = idx < currentEtapaIndex
                const isLocked = idx > currentEtapaIndex
                
                const docsParaEtapa = DOCS_POR_ETAPA[etapa.id] || []
                
                return (
                  <div key={etapa.id} className={`p-4 rounded-xl border transition-all ${isCurrent ? 'bg-primary-container/10 border-primary/20' : 'bg-background/50 border-outline-variant/60'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCompleted ? 'bg-primary text-on-primary' : isCurrent ? 'bg-primary-container text-on-primary-container ring-2 ring-primary/20' : 'bg-outline-variant text-outline'}`}>
                          {idx + 1}
                        </span>
                        <h4 className={`font-semibold ${isLocked ? 'text-outline' : 'text-on-surface'}`}>{etapa.label}</h4>
                      </div>
                      
                      {isCurrent && (
                        <span className="text-[11px] bg-primary-container text-on-primary-container px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Etapa Actual
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      {docsParaEtapa.map(docType => {
                        const uploadedDoc = documentos.find(d => d.etapa === etapa.id && d.tipo_documento === docType.id)
                        
                        return (
                          <div key={docType.id} className="flex items-center justify-between p-3 rounded-lg bg-surface border border-outline-variant/40">
                            <div className="flex items-center gap-2">
                              {uploadedDoc ? (
                                <FileCheck2 size={16} className="text-primary shrink-0" />
                              ) : isLocked ? (
                                <Lock size={16} className="text-outline shrink-0" />
                              ) : docType.optional ? (
                                <FileText size={16} className="text-outline shrink-0" />
                              ) : (
                                <AlertTriangle size={16} className="text-error shrink-0" />
                              )}
                              <span className={`text-xs font-medium ${isLocked ? 'text-outline' : 'text-on-surface'}`}>
                                {docType.label}
                              </span>
                            </div>
                            
                            <div>
                              {uploadedDoc ? (
                                <a 
                                  href={(() => {
                                    const apiUrl = import.meta.env.VITE_API_URL || '';
                                    if (!apiUrl || apiUrl.includes('//backend')) return uploadedDoc.ruta_archivo;
                                    return `${apiUrl}${uploadedDoc.ruta_archivo}`;
                                  })()}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                                >
                                  Ver <ExternalLink size={12} className="inline" />
                                </a>
                              ) : isLocked ? (
                                <span className="text-[10px] text-outline">Bloqueado</span>
                              ) : docType.optional ? (
                                <span className="text-[10px] text-outline font-medium">Opcional</span>
                              ) : (
                                <span className="text-[10px] text-error font-semibold">Falta cargar</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Secciones Futuras / Mantenimiento / Dueños */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Placeholder: Vendedor Asignado */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
              <UserCircle2 size={18} className="text-primary"/>
              Vendedor Asignado
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold">
                JD
              </div>
              <div>
                <p className="font-semibold text-on-surface">Juan Delgado</p>
                <p className="text-xs text-on-surface-variant">Contacto Principal</p>
              </div>
            </div>
          </div>

          {/* Placeholder: Historial */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary"/>
              Historial (Próximamente)
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 opacity-60">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-outline"></div>
                <div>
                  <p className="font-medium text-sm text-on-surface">Service Oficial 60k</p>
                  <p className="text-xs text-on-surface-variant">Sin registrar</p>
                </div>
              </div>
              <div className="flex items-start gap-3 opacity-60">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-outline"></div>
                <div>
                  <p className="font-medium text-sm text-on-surface">Verificación Policial</p>
                  <p className="text-xs text-on-surface-variant">Pendiente</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  )
}
