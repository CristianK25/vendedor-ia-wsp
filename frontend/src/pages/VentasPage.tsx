import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ventasApi } from '../api/ventas'
import { Plus, Search, ListFilter, Download, ChevronDown, ChevronUp } from 'lucide-react'
export default function VentasView() {
  const navigate = useNavigate()
  const [ventas, setVentas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const size = 50;

  type SortConfig = {
    key: 'vehiculo' | 'cliente' | 'fecha' | 'precio_final' | null;
    direction: 'asc' | 'desc';
  }
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  }

  const renderSortIcon = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    }
    return <ChevronDown size={14} className="opacity-30" />;
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true)
    ventasApi.getAll(currentPage, size, debouncedSearch, sortConfig.key || '', sortConfig.direction)
      .then((data: any) => {
        setVentas(data.items)
        setTotalPages(data.total_pages)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [currentPage, debouncedSearch, sortConfig])

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push('...');
      }
    }
    pages = pages.filter((page, index, self) => page !== '...' || self[index - 1] !== '...');

    return (
      <div className="mt-8 flex justify-center items-center gap-1 text-sm pb-8">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors font-semibold"
        >
          &lt; Anterior
        </button>
        
        {pages.map((page, idx) => (
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 text-on-surface-variant">...</span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page as number)}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors font-semibold ${
                currentPage === page 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              {page}
            </button>
          )
        ))}

        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-on-surface-variant hover:text-primary disabled:opacity-30 disabled:hover:text-on-surface-variant transition-colors font-semibold"
        >
          Siguiente &gt;
        </button>
      </div>
    );
  };

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
              placeholder="Buscar por vehículo o cliente..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                  <th className="py-4 px-6">
                    <div onClick={() => handleSort('vehiculo')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                      Vehículo {renderSortIcon('vehiculo')}
                    </div>
                  </th>
                  <th className="py-4 px-6">
                    <div onClick={() => handleSort('cliente')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                      Cliente {renderSortIcon('cliente')}
                    </div>
                  </th>
                  <th className="py-4 px-6">
                    <div onClick={() => handleSort('fecha')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                      Fecha {renderSortIcon('fecha')}
                    </div>
                  </th>
                  <th className="py-4 px-6">
                    <div onClick={() => handleSort('precio_final')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                      Precio Final {renderSortIcon('precio_final')}
                    </div>
                  </th>
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
                      <td className="py-4 px-6 text-on-surface-variant">
                        <div className="font-semibold text-on-surface">{v.vehiculo_modelo || 'N/A'}</div>
                        <div className="text-xs">ID: {v.vehiculo_id}</div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">
                        <div className="font-semibold text-on-surface">{v.cliente_nombre || 'N/A'}</div>
                        <div className="text-xs">{v.cliente_telefono}</div>
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">{new Date(v.fecha).toLocaleDateString()}</td>
                      <td className="py-4 px-6 font-bold text-primary">${v.precio_final.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {renderPagination()}
      </div>
    </section>
  )
}
