import { useEffect, useState } from 'react'
import { promocionesApi } from '../api/promociones'
import { Plus, Edit2, Ban, Search } from 'lucide-react'
export default function PromocionesView() {
  const [promociones, setPromociones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    promocionesApi.getAll()
      .then(data => {
        setPromociones(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <section className="px-4 md:px-10 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Promociones y Campañas</h2>
          <p className="text-base text-on-surface-variant mt-1">Administra las campañas activas y promociones para clientes.</p>
        </div>
        <button className="bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95">
          <Plus size={20} />
          Crear Promoción
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input 
            className="w-full pl-10 pr-4 h-11 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm" 
            placeholder="Buscar promoción..." 
            type="text"
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-on-surface-variant">Cargando promociones...</p>
      ) : (
        <div className="mt-8 space-y-4">
          {promociones.length === 0 ? (
            <p className="text-on-surface-variant">No hay promociones registradas.</p>
          ) : (
            promociones.map(p => (
              <div key={p.id} className="premium-card-hover bg-white border border-outline-variant rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-xl text-on-surface">{p.titulo}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${p.estado === 'activa' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-surface-container-high text-on-surface-variant border-outline-variant'}`}>
                      {p.estado === 'activa' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <p className="text-on-surface-variant mb-3">{p.descripcion}</p>
                  <p className="text-sm font-medium text-primary">
                    Válida: {new Date(p.fecha_inicio).toLocaleDateString()} - {new Date(p.fecha_fin).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button className="flex-1 md:flex-none bg-surface-container-low hover:bg-surface-container-high text-on-surface px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    <Edit2 size={16} /> Editar
                  </button>
                  <button className="flex-1 md:flex-none bg-error-container/20 hover:bg-error-container text-error px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    <Ban size={16} /> Desactivar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}
