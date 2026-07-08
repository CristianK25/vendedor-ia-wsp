import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ventasApi } from '../api/ventas'
import { Plus, Search, ListFilter, Download } from 'lucide-react'
export default function VentasView() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ventasApi.getAll()
      .then(data => {
        setVentas(data)
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
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Ventas</h2>
          <p className="text-base text-on-surface-variant mt-1">Historial y registro inmutable de transacciones.</p>
        </div>
        <button 
          onClick={() => navigate('/ventas/nuevo')}
          className="bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} />
          Registrar Venta
        </button>
      </div>

      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm" 
              placeholder="Buscar venta..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
              <ListFilter size={18} /> Filtros
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
              <Download size={18} /> Exportar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Cargando ventas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Vehículo ID</th>
                  <th className="py-4 px-6">Cliente (Tel)</th>
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Precio Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant">No hay ventas registradas.</td>
                  </tr>
                ) : (
                  ventas.map(v => (
                    <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-4 px-6 text-on-surface-variant">{v.vehiculo_id}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{v.cliente_telefono}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{new Date(v.fecha).toLocaleDateString()}</td>
                      <td className="py-4 px-6 font-bold text-primary">${v.precio_final.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
