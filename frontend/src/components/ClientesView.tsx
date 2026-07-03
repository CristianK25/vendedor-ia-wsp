import { useEffect, useState } from 'react'
import { clientesApi } from '../api/clientes'
import { Plus, Search, ListFilter, Download, ChevronRight } from 'lucide-react'
export default function ClientesView() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientesApi.getAll()
      .then(data => {
        setClientes(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <section className="px-4 md:px-10 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Clientes y Ventas</h2>
          <p className="text-base text-on-surface-variant mt-1">Gestione sus relaciones y transacciones comerciales.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all">
            <Plus size={20} />
            Nueva Venta
          </button>
        </div>
      </div>

      {/* Stats Row (Bento Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Ventas Mes</span>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-primary">€142,500</span>
            <span className="text-emerald-600 text-xs font-semibold flex items-center bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Nuevos Clientes</span>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-on-surface">24</span>
            <span className="text-emerald-600 text-xs font-semibold flex items-center bg-emerald-50 px-2 py-1 rounded-full">+4%</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Tasa Conversión</span>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-on-surface">18.2%</span>
            <span className="text-on-error-container text-xs font-semibold flex items-center bg-error-container px-2 py-1 rounded-full">-2%</span>
          </div>
        </div>
        <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Lead Score Promedio</span>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-on-surface">84</span>
            <span className="text-primary text-xs font-semibold flex items-center bg-primary-container/20 px-2 py-1 rounded-full">Top</span>
          </div>
        </div>
      </div>

      {/* Main Data View */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        {/* Table Header / Search */}
        <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm" 
              placeholder="Buscar cliente por nombre o teléfono..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
              <ListFilter size={18} />
              Filtros
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
              <Download size={18} />
              Exportar
            </button>
          </div>
        </div>

        {/* Client List (Mobile Optimized Table) */}
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Cargando clientes...</div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {/* Subtle List Headers (Desktop Only) */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
              <div className="col-span-4">Cliente</div>
              <div className="col-span-3">Contacto</div>
              <div className="col-span-2">Última Interacción</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-1 text-right">Acción</div>
            </div>

            {clientes.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No hay clientes registrados.</div>
            ) : (
              clientes.map(c => {
                const initials = c.nombre ? c.nombre.substring(0, 2).toUpperCase() : 'NN';
                return (
                  <div key={c.telefono} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <div className="col-span-1 md:col-span-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-semibold text-on-surface">{c.nombre || 'Sin Nombre'}</span>
                        <span className="text-sm text-on-surface-variant">Tel: {c.telefono}</span>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-3 flex items-center">
                      <span className="text-base text-on-surface-variant">{c.telefono}</span>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center">
                      <span className="text-base text-on-surface-variant">
                        {c.ultima_interaccion_cliente ? new Date(c.ultima_interaccion_cliente).toLocaleDateString() : 'Ninguna'}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-container/10 text-primary-container border border-primary-container/20">
                        Compras: {c.cantidad_compras}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                      <ChevronRight className="text-on-surface-variant group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </section>
  )
}
