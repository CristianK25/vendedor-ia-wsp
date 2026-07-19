import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi, etiquetasApi } from '../api/clientes'
import { Plus, Search, ListFilter, Download, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import EtiquetasModal, { PALETA_COLORES } from '../components/EtiquetasModal'

const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

export default function ClientesView() {
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterEtiqueta, setFilterEtiqueta] = useState<number | null>(null);
  
  const [etiquetas, setEtiquetas] = useState<any[]>([]);
  const [showEtiquetasModal, setShowEtiquetasModal] = useState(false);
  const [openTagDropdownFor, setOpenTagDropdownFor] = useState<string | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const size = 50;

  type SortConfig = {
    key: 'nombre' | 'telefono' | 'ultima_interaccion_cliente' | 'cantidad_compras' | null;
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
    const fetchClientes = (isSilent = false) => {
      if (!isSilent) setLoading(true);
      
      clientesApi.getAll(currentPage, size, debouncedSearch, sortConfig.key || '', sortConfig.direction, filterEtiqueta)
        .then((data: any) => {
          setClientes(data.items)
          setTotalPages(data.total_pages)
          if (!isSilent) setLoading(false)
        })
        .catch(err => {
          console.error(err)
          if (!isSilent) setLoading(false)
        })
    };

    // 1. Carga inicial (con pantalla de carga si aplica)
    fetchClientes(false);

    // 2. Polling silencioso cada 10 segundos
    const intervalId = setInterval(() => {
      fetchClientes(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, [currentPage, debouncedSearch, sortConfig, filterEtiqueta])

  const fetchEtiquetas = () => {
    etiquetasApi.getAll().then((data: any) => setEtiquetas(data)).catch(console.error);
  };

  useEffect(() => {
    fetchEtiquetas();
  }, []);

  const handleAssignEtiqueta = async (telefono: string, etiquetaId: number | null) => {
    try {
      await clientesApi.update(telefono, { etiqueta_id: etiquetaId });
      setClientes(prev => prev.map(c => c.telefono === telefono ? { ...c, etiqueta: etiquetaId ? etiquetas.find(e => e.id === etiquetaId) : null } : c));
    } catch (e) {
      console.error(e);
    }
    setOpenTagDropdownFor(null);
  };

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

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Ninguna';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Hace un momento';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`;
    if (diffInSeconds < 172800) return 'Ayer';
    return date.toLocaleDateString();
  };

  return (
    <section className="px-4 md:px-10 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Clientes y Ventas</h2>
          <p className="text-base text-on-surface-variant mt-1">Gestione sus relaciones y transacciones comerciales.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/clientes/nuevo')}
            className="bg-primary text-on-primary rounded-xl px-6 py-3 text-sm font-semibold flex items-center gap-2 shadow-sm hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>
      </div>


      {/* Main Data View */}
      <div className="bg-white border border-outline-variant rounded-2xl overflow-visible shadow-sm">
        {/* Table Header / Search */}
        <div className="p-4 border-b border-outline-variant flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-auto flex-1 max-w-2xl flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input 
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm" 
                placeholder="Buscar cliente por nombre o teléfono..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center justify-between min-w-[180px] h-full px-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {filterEtiqueta === null ? (
                    <span className="text-on-surface-variant font-medium">Todas las etiquetas</span>
                  ) : filterEtiqueta === 0 ? (
                    <>
                      <span className="w-3 h-3 rounded-full bg-slate-300" />
                      <span className="text-on-surface font-medium">Sin etiqueta</span>
                    </>
                  ) : (
                    <>
                      <span 
                        className={`w-3 h-3 rounded-full ${PALETA_COLORES[etiquetas.find(e => e.id === filterEtiqueta)?.color || '']?.bg || 'bg-slate-100'}`}
                        style={{ backgroundColor: PALETA_COLORES[etiquetas.find(e => e.id === filterEtiqueta)?.color || '']?.preview }}
                      />
                      <span className="text-on-surface font-medium">{etiquetas.find(e => e.id === filterEtiqueta)?.nombre || 'Desconocida'}</span>
                    </>
                  )}
                </div>
                <ChevronDown size={16} className="text-on-surface-variant opacity-70 ml-2" />
              </button>
              
              {isFilterDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsFilterDropdownOpen(false)} 
                  />
                  <div className="absolute top-full left-0 mt-2 z-50 w-full min-w-[200px] bg-surface rounded-xl shadow-lg border border-outline-variant overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => { setFilterEtiqueta(null); setIsFilterDropdownOpen(false); }}
                      className="px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors font-medium"
                    >
                      Todas las etiquetas
                    </button>
                    <button
                      onClick={() => { setFilterEtiqueta(0); setIsFilterDropdownOpen(false); }}
                      className="px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 font-medium"
                    >
                      <span className="w-3 h-3 rounded-full bg-slate-300" />
                      Sin etiqueta
                    </button>
                    <div className="h-[1px] w-full bg-outline-variant/50 my-1"></div>
                    {etiquetas.map(etq => (
                      <button
                        key={etq.id}
                        onClick={() => { setFilterEtiqueta(etq.id); setIsFilterDropdownOpen(false); }}
                        className="px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2 font-medium"
                      >
                        <span className={`w-3 h-3 rounded-full ${PALETA_COLORES[etq.color]?.bg || 'bg-slate-100'}`} style={{ backgroundColor: PALETA_COLORES[etq.color]?.preview }} />
                        {etq.nombre}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button onClick={() => setShowEtiquetasModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded-xl text-sm font-semibold hover:bg-surface-container-low transition-colors text-on-surface">
              <Tag size={18} />
              Etiquetas
            </button>
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
              <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-on-surface w-max select-none" onClick={() => handleSort('nombre')}>
                Cliente {renderSortIcon('nombre')}
              </div>
              <div className="col-span-2">Etiqueta</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-on-surface w-max select-none" onClick={() => handleSort('ultima_interaccion_cliente')}>
                Última Interacción {renderSortIcon('ultima_interaccion_cliente')}
              </div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-on-surface w-max select-none" onClick={() => handleSort('cantidad_compras')}>
                Historial {renderSortIcon('cantidad_compras')}
              </div>
              <div className="col-span-1 text-right">Acción</div>
            </div>

            {clientes.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No hay clientes registrados.</div>
            ) : (
              clientes.map(c => {
                const initials = c.nombre ? c.nombre.substring(0, 2).toUpperCase() : 'NN';
                return (
                  <div key={c.telefono} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-surface-container-low transition-colors group">
                    <div className="col-span-1 md:col-span-3 flex items-center gap-4 cursor-pointer" onClick={() => navigate(`/clientes/${c.telefono}`)}>
                      <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-lg shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-base font-semibold text-on-surface truncate">{c.nombre || 'Sin Nombre'}</span>
                        <span className="text-sm text-on-surface-variant truncate">Tel: {c.telefono}</span>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center">
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenTagDropdownFor(openTagDropdownFor === c.telefono ? null : c.telefono); }}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                            c.etiqueta 
                              ? `${PALETA_COLORES[c.etiqueta.color]?.bg || 'bg-slate-100'} ${PALETA_COLORES[c.etiqueta.color]?.text || 'text-slate-700'} ${PALETA_COLORES[c.etiqueta.color]?.border || 'border-slate-200'} hover:brightness-95`
                              : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container'
                          }`}
                        >
                          <Tag size={12} />
                          {c.etiqueta ? c.etiqueta.nombre : 'Sin etiqueta'}
                        </button>
                        
                        {openTagDropdownFor === c.telefono && (
                          <div className="absolute top-full left-0 mt-1 z-50 w-48 bg-surface rounded-xl shadow-lg border border-outline-variant overflow-hidden flex flex-col py-1 animate-in fade-in slide-in-from-top-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAssignEtiqueta(c.telefono, null); }}
                              className="px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                            >
                              Sin etiqueta
                            </button>
                            {etiquetas.map(etq => (
                              <button
                                key={etq.id}
                                onClick={(e) => { e.stopPropagation(); handleAssignEtiqueta(c.telefono, etq.id); }}
                                className="px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-2"
                              >
                                <span className={`w-3 h-3 rounded-full ${PALETA_COLORES[etq.color]?.bg || 'bg-slate-100'}`} style={{ backgroundColor: PALETA_COLORES[etq.color]?.preview }} />
                                {etq.nombre}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-1 md:col-span-2 flex items-center">
                      {c.tiene_cita_pendiente ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 shadow-sm">
                          CON CITA PENDIENTE
                        </span>
                      ) : c.estado_conversacion === 'ESPERANDO_RESEÑA' ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                          ESPERANDO RESEÑA
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant border border-outline-variant">
                          NORMAL
                        </span>
                      )}
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center">
                      <span className="text-base font-medium text-on-surface-variant">
                        {getRelativeTime(c.ultima_interaccion_cliente)}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex items-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        c.cantidad_compras > 0 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-surface-container text-on-surface-variant border-outline-variant'
                      }`}>
                        Compras: {c.cantidad_compras}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-1 flex items-center justify-end">
                      <div className="flex items-center gap-2">
                        <a 
                          href={`https://wa.me/${c.telefono.replace('+', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                          title="WhatsApp"
                        >
                          <WhatsAppIcon size={20} />
                        </a>
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate('/ventas/nuevo', { state: { telefono: c.telefono }}); }}
                          className="p-2 text-primary hover:bg-primary-container rounded-full transition-colors"
                          title="Nueva Venta"
                        >
                          <Tag size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
        {renderPagination()}
      </div>

      <EtiquetasModal 
        isOpen={showEtiquetasModal}
        onClose={() => setShowEtiquetasModal(false)}
        etiquetas={etiquetas}
        refreshEtiquetas={fetchEtiquetas}
      />
    </section>
  )
}
