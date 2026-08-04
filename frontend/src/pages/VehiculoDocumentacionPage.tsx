import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Car, FileText, Loader2 } from 'lucide-react'
import { vehiculosApi } from '../api/vehiculos'
import DocumentacionStepForm from '../components/forms/DocumentacionStepForm'

export default function VehiculoDocumentacionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [vehiculo, setVehiculo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    
    vehiculosApi.getById(Number(id))
      .then(data => {
        setVehiculo(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setError('No se pudo cargar la información del vehículo.')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-on-surface-variant">
        <Loader2 className="animate-spin text-primary mb-2" size={32} />
        <span>Cargando información del vehículo...</span>
      </div>
    )
  }

  if (error || !vehiculo) {
    return (
      <div className="p-10 text-center">
        <p className="text-error mb-4">{error || 'Vehículo no encontrado'}</p>
        <button onClick={() => navigate('/vehiculos')} className="text-primary hover:underline flex items-center gap-2 mx-auto font-medium">
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-10 py-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header y Navegación */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-8 mb-8 pb-6 border-b border-outline-variant">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <button
            onClick={() => navigate(`/vehiculos/${vehiculo.id}`)}
            className="w-10 h-10 flex-shrink-0 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors mt-1"
            title="Volver a la ficha técnica"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Car size={16} />
              <span>{vehiculo.patente.toUpperCase()}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface mt-1 leading-tight text-balance break-words">
              Documentación: <span className="text-primary">{vehiculo.modelo}</span>
            </h1>
          </div>
        </div>
        
        <button
          onClick={() => navigate(`/vehiculos/${vehiculo.id}`)}
          className="flex items-center justify-center flex-shrink-0 gap-2 px-4 py-2.5 bg-surface border border-outline-variant text-on-surface rounded-xl text-sm font-semibold hover:bg-surface-container-high transition-all md:mt-1"
        >
          <FileText size={16} />
          Volver a la Ficha Técnica
        </button>
      </div>

      {/* Formulario de Stepper y Documentos */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 md:p-8 shadow-sm">
        <DocumentacionStepForm vehiculoId={vehiculo.id} />
      </div>
    </div>
  )
}
