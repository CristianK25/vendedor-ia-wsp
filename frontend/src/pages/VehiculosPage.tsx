import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vehiculosApi } from '../api/vehiculos'
import { Plus, Search, ListFilter, ArrowUpDown, MoreVertical, Gauge, Settings2, ImageOff } from 'lucide-react'
export default function VehiculosView() {
  const navigate = useNavigate()
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    vehiculosApi.getAll()
      .then(data => {
        setVehiculos(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const handleMarcarVendido = async (id: number, vehiculo: any) => {
    try {
      const dataToUpdate = { ...vehiculo, estado: 'vendido' }
      await vehiculosApi.update(id, dataToUpdate)
      setVehiculos(prev => prev.map(v => v.id === id ? { ...v, estado: 'vendido' } : v))
    } catch (error) {
      console.error('Error al marcar como vendido:', error)
      alert('Hubo un error al actualizar el estado.')
    }
  }

  return (
    <section className="px-4 md:px-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Vehículos</h2>
          <p className="text-base text-on-surface-variant mt-1">Gestiona el inventario de tu concesionario en tiempo real.</p>
        </div>
        <button 
          onClick={() => navigate('/vehiculos/nuevo')}
          className="bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} />
          Agregar Vehículo
        </button>
      </div>

      {/* Filters Bar (Minimalist) */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input 
            className="w-full pl-10 pr-4 h-11 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
            placeholder="Buscar por marca, modelo o VIN..." 
            type="text"
          />
        </div>
        <button className="px-4 h-11 bg-white border border-outline-variant rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors text-sm font-semibold text-on-surface">
          <ListFilter size={20} />
          Filtros
        </button>
        <button className="px-4 h-11 bg-white border border-outline-variant rounded-lg flex items-center gap-2 hover:bg-surface-container-low transition-colors text-sm font-semibold text-on-surface">
          <ArrowUpDown size={20} />
          Precio: Menor a Mayor
        </button>
      </div>

      {loading ? (
        <p className="mt-8 text-on-surface-variant">Cargando vehículos...</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehiculos.length === 0 ? (
            <p className="text-on-surface-variant">No hay vehículos registrados.</p>
          ) : (
            vehiculos.map(v => (
              <div 
                key={v.id} 
                onClick={() => navigate(`/vehiculos/${v.id}`)}
                className="premium-card-hover bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col group cursor-pointer"
              >
                <div className="relative h-48 w-full overflow-hidden bg-surface-container flex items-center justify-center text-outline">
                  {v.imagenes && v.imagenes.length > 0 ? (
                    <img 
                      src={v.imagenes[0].ruta.startsWith('http') ? v.imagenes[0].ruta : `http://localhost:8000${v.imagenes[0].ruta}`}
                      alt={v.modelo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ImageOff size={48} className="opacity-20" />
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${v.estado === 'disponible' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                      {v.estado === 'disponible' ? 'Disponible' : 'Vendido'}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-on-surface leading-tight">{v.modelo}</h3>
                    <button className="text-on-surface-variant hover:text-primary"><MoreVertical size={20} /></button>
                  </div>
                  <div className="flex items-center gap-4 text-on-surface-variant text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Gauge size={16} />
                      {v.kilometraje.toLocaleString()} km
                    </div>
                    <div className="flex items-center gap-1">
                      <Settings2 size={16} />
                      Automático {/* Mocked, we can add this to backend later */}
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-primary font-bold text-xl">${v.precio.toLocaleString()}</span>
                    {v.estado === 'disponible' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarcarVendido(v.id, v); }}
                        className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg uppercase font-semibold transition-colors"
                      >
                        Marcar Vendido
                      </button>
                    ) : (
                      <span className="text-xs text-on-surface-variant uppercase font-semibold">Vendido</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
