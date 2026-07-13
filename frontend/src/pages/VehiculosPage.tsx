import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vehiculosApi } from '../api/vehiculos'
import { Plus, Search, ListFilter, MoreVertical, Gauge, Settings2, ImageOff, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react'
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import MarcarVendidoModal from '../components/modals/MarcarVendidoModal'
export default function VehiculosView() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('vehiculosViewMode') as 'list' | 'grid') || 'list'
  })
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vehiculoParaVender, setVehiculoParaVender] = useState<any>(null)

  // Paginación, Búsqueda y Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<'todos' | 'disponible' | 'vendido'>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced Filters State
  const [stats, setStats] = useState<any>(null);
  const [precioRango, setPrecioRango] = useState<[number, number]>([0, 100000]);
  const [kmRango, setKmRango] = useState<[number, number]>([0, 200000]);
  const [anioRango, setAnioRango] = useState<[number, number]>([2000, new Date().getFullYear()]);
  const [filterTransmision, setFilterTransmision] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState<{
    precioRango: [number, number];
    kmRango: [number, number];
    anioRango: [number, number];
    filterTransmision: string;
  }>({
    precioRango: [0, 100000],
    kmRango: [0, 200000],
    anioRango: [2000, new Date().getFullYear()],
    filterTransmision: ''
  });
  const [fetchTrigger, setFetchTrigger] = useState(0);
  
  const size = 50;

  type SortConfig = {
    key: 'modelo' | 'kilometraje' | 'transmision' | 'estado' | 'precio' | null;
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

  // Debounce para búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Volver a la página 1 al buscar
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Cargar estadísticas
  useEffect(() => {
    vehiculosApi.getStats().then((data: any) => {
      setStats(data);
      const initialPrecio: [number, number] = [data.precio_min || 0, data.precio_max || 100000];
      const initialKm: [number, number] = [data.km_min || 0, data.km_max || 200000];
      const initialAnio: [number, number] = [data.anio_min || 2000, data.anio_max || new Date().getFullYear()];
      setPrecioRango(initialPrecio);
      setKmRango(initialKm);
      setAnioRango(initialAnio);
      setAppliedFilters({
        precioRango: initialPrecio,
        kmRango: initialKm,
        anioRango: initialAnio,
        filterTransmision: ''
      });
    }).catch(console.error);
  }, []);

  // Cargar datos
  useEffect(() => {
    setLoading(true);
    const estadoQuery = filterEstado === 'todos' ? '' : filterEstado;
    const filters = {
      page: currentPage,
      size,
      search: debouncedSearch,
      estado: estadoQuery,
      precio_min: appliedFilters.precioRango[0],
      precio_max: appliedFilters.precioRango[1],
      km_min: appliedFilters.kmRango[0],
      km_max: appliedFilters.kmRango[1],
      anio_min: appliedFilters.anioRango[0],
      anio_max: appliedFilters.anioRango[1],
      transmision: appliedFilters.filterTransmision === 'Todas' ? '' : appliedFilters.filterTransmision,
      sortBy: sortConfig.key || '',
      sortDir: sortConfig.direction
    };
    vehiculosApi.getAll(filters)
      .then((data: any) => {
        setVehiculos(data.items);
        setTotalPages(data.total_pages);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentPage, debouncedSearch, sortConfig, filterEstado, appliedFilters, fetchTrigger])

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
      <div className="mt-8 flex justify-center items-center gap-1 text-sm">
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

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode)
    localStorage.setItem('vehiculosViewMode', mode)
  }

  const handleMarcarVendido = async (vehiculo: any) => {
    setVehiculoParaVender(vehiculo)
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-4 h-11 border rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold ${showAdvancedFilters ? 'bg-primary-container text-on-primary-container border-primary/20' : 'bg-white border-outline-variant text-on-surface hover:bg-surface-container-low'}`}
        >
          <ListFilter size={20} />
          Filtros
        </button>

        {/* Tabs de Filtro de Estado */}
        <div className="flex bg-surface-container-low border border-outline-variant rounded-lg p-1 h-11">
          <button 
            onClick={() => setFilterEstado('todos')}
            className={`px-4 rounded-md transition-colors text-sm font-semibold flex items-center gap-1 ${filterEstado === 'todos' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterEstado('disponible')}
            className={`px-4 rounded-md transition-colors text-sm font-semibold flex items-center gap-1.5 ${filterEstado === 'disponible' ? 'bg-white shadow-sm text-emerald-600' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className={`w-2 h-2 rounded-full ${filterEstado === 'disponible' ? 'bg-emerald-500' : 'bg-emerald-500/50'}`}></span>
            Disponibles
          </button>
          <button 
            onClick={() => setFilterEstado('vendido')}
            className={`px-4 rounded-md transition-colors text-sm font-semibold flex items-center gap-1.5 ${filterEstado === 'vendido' ? 'bg-white shadow-sm text-red-600' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className={`w-2 h-2 rounded-full ${filterEstado === 'vendido' ? 'bg-red-500' : 'bg-red-500/50'}`}></span>
            Vendidos
          </button>
        </div>

        <div className="ml-auto flex items-center bg-surface-container-low border border-outline-variant rounded-lg p-1 h-11">
          <button 
            onClick={() => handleViewModeChange('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            title="Vista de Lista"
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            title="Vista de Tarjetas"
          >
            <LayoutGrid size={20} />
          </button>
        </div>
      </div>

      {/* Panel de Filtros Avanzados (Acordeón) */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          showAdvancedFilters ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 mt-0 opacity-0'
        }`}
      >
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Filtro: Rango de Precio */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <span>Precio Mínimo</span>
                <span>Máximo</span>
              </div>
              <div className="px-2">
                {stats && (
                  <Slider
                    range
                    min={stats.precio_min || 0}
                    max={stats.precio_max || 100000}
                    value={precioRango}
                    onChange={(val) => setPrecioRango(val as [number, number])}
                    trackStyle={[{ backgroundColor: '#4F46E5' }]}
                    handleStyle={[
                      { borderColor: '#4F46E5' },
                      { borderColor: '#4F46E5' }
                    ]}
                  />
                )}
              </div>
              <div className="flex justify-between text-sm font-medium text-surface-900 mt-1">
                <span>${precioRango[0].toLocaleString()}</span>
                <span>${precioRango[1].toLocaleString()}</span>
              </div>
            </div>

            {/* Filtro: Kilometraje */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <span>Kilometraje Min</span>
                <span>Max</span>
              </div>
              <div className="px-2">
                {stats && (
                  <Slider
                    range
                    min={stats.km_min || 0}
                    max={stats.km_max || 200000}
                    value={kmRango}
                    onChange={(val) => setKmRango(val as [number, number])}
                    trackStyle={[{ backgroundColor: '#4F46E5' }]}
                    handleStyle={[
                      { borderColor: '#4F46E5' },
                      { borderColor: '#4F46E5' }
                    ]}
                  />
                )}
              </div>
              <div className="flex justify-between text-sm font-medium text-surface-900 mt-1">
                <span>{kmRango[0].toLocaleString()} km</span>
                <span>{kmRango[1].toLocaleString()} km</span>
              </div>
            </div>

            {/* Filtro: Año */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <span>Año Desde</span>
                <span>Hasta</span>
              </div>
              <div className="px-2">
                {stats && (
                  <Slider
                    range
                    min={stats.anio_min || 2000}
                    max={stats.anio_max || new Date().getFullYear()}
                    value={anioRango}
                    onChange={(val) => setAnioRango(val as [number, number])}
                    trackStyle={[{ backgroundColor: '#4F46E5' }]}
                    handleStyle={[
                      { borderColor: '#4F46E5' },
                      { borderColor: '#4F46E5' }
                    ]}
                  />
                )}
              </div>
              <div className="flex justify-between text-sm font-medium text-surface-900 mt-1">
                <span>{anioRango[0]}</span>
                <span>{anioRango[1]}</span>
              </div>
            </div>

            {/* Filtro: Transmisión */}
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Transmisión</label>
              <select 
                value={filterTransmision}
                onChange={(e) => setFilterTransmision(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              >
                <option value="Todas">Todas</option>
                <option value="Automática">Automática</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

          </div>
          
          <div className="flex justify-end items-center gap-3 mt-5 pt-4 border-t border-outline-variant/50">
            <button 
              onClick={() => {
                if (stats) {
                  const defaultPrecio: [number, number] = [stats.precio_min || 0, stats.precio_max || 100000];
                  const defaultKm: [number, number] = [stats.km_min || 0, stats.km_max || 200000];
                  const defaultAnio: [number, number] = [stats.anio_min || 2000, stats.anio_max || new Date().getFullYear()];
                  setPrecioRango(defaultPrecio);
                  setKmRango(defaultKm);
                  setAnioRango(defaultAnio);
                  setFilterTransmision('Todas');
                  setAppliedFilters({
                    precioRango: defaultPrecio,
                    kmRango: defaultKm,
                    anioRango: defaultAnio,
                    filterTransmision: 'Todas'
                  });
                } else {
                  setPrecioRango([0, 100000]);
                  setKmRango([0, 200000]);
                  setAnioRango([2000, new Date().getFullYear()]);
                  setFilterTransmision('Todas');
                  setAppliedFilters({
                    precioRango: [0, 100000],
                    kmRango: [0, 200000],
                    anioRango: [2000, new Date().getFullYear()],
                    filterTransmision: 'Todas'
                  });
                }
                setFilterEstado('todos');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Limpiar Filtros
            </button>
            <button 
              onClick={() => {
                setCurrentPage(1);
                setAppliedFilters({
                  precioRango,
                  kmRango,
                  anioRango,
                  filterTransmision
                });
              }}
              className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-lg text-sm font-bold transition-colors shadow-sm"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-on-surface-variant">Cargando vehículos...</p>
      ) : (
        <>
          {viewMode === 'grid' ? (
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
                          src={v.imagenes[0].ruta.trim().startsWith('http') ? v.imagenes[0].ruta.trim() : `http://localhost:8000${v.imagenes[0].ruta.trim()}`}
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
                          Automático {/* Mocked */}
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-primary font-bold text-xl">${v.precio.toLocaleString()}</span>
                        {v.estado === 'disponible' ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleMarcarVendido(v); }}
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
          ) : (
            <div className="mt-8 overflow-x-auto bg-white border border-outline-variant rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                    <th className="py-4 px-6">
                      <div onClick={() => handleSort('modelo')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                        Vehículo {renderSortIcon('modelo')}
                      </div>
                    </th>
                    <th className="py-4 px-6">
                      <div onClick={() => handleSort('kilometraje')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                        Kilometraje {renderSortIcon('kilometraje')}
                      </div>
                    </th>
                    <th className="py-4 px-6">
                      <div onClick={() => handleSort('transmision')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                        Transmisión {renderSortIcon('transmision')}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center">
                      <div onClick={() => handleSort('estado')} className="flex items-center justify-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max mx-auto">
                        Estado {renderSortIcon('estado')}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-right">
                      <div onClick={() => handleSort('precio')} className="flex items-center justify-end gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max ml-auto">
                        Precio {renderSortIcon('precio')}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {vehiculos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant">No hay vehículos registrados.</td>
                    </tr>
                  ) : (
                    vehiculos.map(v => (
                      <tr 
                        key={v.id} 
                        onClick={() => navigate(`/vehiculos/${v.id}`)}
                        className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 font-bold text-on-surface">{v.modelo}</td>
                        <td className="py-4 px-6 text-on-surface-variant">
                          <div className="flex items-center gap-1.5">
                            <Gauge size={14} />{v.kilometraje.toLocaleString()} km
                          </div>
                        </td>
                        <td className="py-4 px-6 text-on-surface-variant">
                          <div className="flex items-center gap-1.5">
                            <Settings2 size={14} />Automático
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${v.estado === 'disponible' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {v.estado === 'disponible' ? 'Disponible' : 'Vendido'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-primary text-right">${v.precio.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {v.estado === 'disponible' ? (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleMarcarVendido(v); }}
                                className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg uppercase font-semibold transition-colors w-32 whitespace-nowrap text-center"
                              >
                                Marcar Vendido
                              </button>
                            ) : (
                              <span className="text-xs text-on-surface-variant uppercase font-semibold w-32 whitespace-nowrap text-center px-3 py-1.5">Vendido</span>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); }}
                              className="text-on-surface-variant hover:text-primary p-1"
                            >
                              <MoreVertical size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {renderPagination()}
        </>
      )}

      {vehiculoParaVender && (
        <MarcarVendidoModal
          vehiculo={vehiculoParaVender}
          onClose={() => setVehiculoParaVender(null)}
          onSuccess={() => {
            setVehiculoParaVender(null);
            setFetchTrigger(prev => prev + 1);
          }}
        />
      )}
    </section>
  )
}
