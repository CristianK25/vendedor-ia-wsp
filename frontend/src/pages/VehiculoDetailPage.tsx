import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vehiculosApi } from '../api/vehiculos'
import { 
  ArrowLeft, Edit2, CheckCircle2, 
  Wrench, FileText,
  ImageOff, ChevronLeft, ChevronRight, UserCircle2, ShieldCheck
} from 'lucide-react'

export default function VehiculoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [vehiculo, setVehiculo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Galería
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    if (!id) return
    
    vehiculosApi.getById(Number(id))
      .then(data => {
        setVehiculo(data)
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
          <div className="text-primary font-bold text-4xl mb-1">${vehiculo.precio.toLocaleString()}</div>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${vehiculo.estado === 'disponible' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            <CheckCircle2 size={14} />
            {vehiculo.estado === 'disponible' ? 'Disponible para la Venta' : 'Vendido'}
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
                    src={vehiculo.imagenes[activeImageIndex].ruta.startsWith('http') ? vehiculo.imagenes[activeImageIndex].ruta : `http://localhost:8000${vehiculo.imagenes[activeImageIndex].ruta}`} 
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
                      src={img.ruta.startsWith('http') ? img.ruta : `http://localhost:8000${img.ruta}`} 
                      alt="thumbnail" 
                      className="w-full h-full object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Datos Generales (Tabla/Grid) */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8">
            <h3 className="text-xl font-semibold text-on-surface mb-6 border-b border-outline-variant pb-3 flex items-center gap-2">
              <FileText size={20} className="text-primary"/>
              Ficha Técnica
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Kilometraje</span>
                <span className="font-semibold text-on-surface flex items-center gap-1">
                  {vehiculo.kilometraje.toLocaleString()} km
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">Estado</span>
                <span className="font-semibold text-on-surface capitalize">{vehiculo.estado}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-outline-variant/30">
                <span className="text-on-surface-variant">ID Referencia</span>
                <span className="font-semibold text-on-surface">#{vehiculo.id.toString().padStart(4, '0')}</span>
              </div>
            </div>
          </div>
          
          {/* Equipamiento y Detalles */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8">
             <h3 className="text-xl font-semibold text-on-surface mb-6 border-b border-outline-variant pb-3 flex items-center gap-2">
              <Wrench size={20} className="text-primary"/>
              Equipamiento y Detalles
            </h3>
            
            <div className="space-y-6">
              {vehiculo.detalle_interior && (
                <div>
                  <h4 className="font-semibold text-on-surface mb-2 text-sm uppercase tracking-wider">Interior</h4>
                  <p className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed bg-surface-container-low p-4 rounded-xl">
                    {vehiculo.detalle_interior}
                  </p>
                </div>
              )}
              
              {vehiculo.detalle_exterior && (
                <div>
                  <h4 className="font-semibold text-on-surface mb-2 text-sm uppercase tracking-wider">Exterior</h4>
                  <p className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed bg-surface-container-low p-4 rounded-xl">
                    {vehiculo.detalle_exterior}
                  </p>
                </div>
              )}

              {vehiculo.informacion_extra && (
                <div>
                  <h4 className="font-semibold text-on-surface mb-2 text-sm uppercase tracking-wider">Comentarios del Vendedor</h4>
                  <p className="text-on-surface-variant text-sm whitespace-pre-wrap leading-relaxed bg-surface-container-low p-4 rounded-xl">
                    {vehiculo.informacion_extra}
                  </p>
                </div>
              )}
              
              {(!vehiculo.detalle_interior && !vehiculo.detalle_exterior && !vehiculo.informacion_extra) && (
                <p className="text-on-surface-variant text-sm italic">No hay detalles adicionales especificados para este vehículo.</p>
              )}
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
