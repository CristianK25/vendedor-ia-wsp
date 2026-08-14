import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vehiculosApi } from '../api/vehiculos'
import { Plus, Search, ListFilter, Trash2, ImageOff, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react'
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import MarcarVendidoModal from '../components/modals/MarcarVendidoModal'
import DeleteVehiculoModal from '../components/modals/DeleteVehiculoModal'
import { useAuthStore } from '../store/authStore'
export default function VehiculosView() {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const isStock = usuario?.rol === 'STOCK'
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('vehiculosViewMode') as 'list' | 'grid') || 'list'
  })
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vehiculoParaVender, setVehiculoParaVender] = useState<any>(null)
  
  const [vehiculoParaEliminar, setVehiculoParaEliminar] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!vehiculoParaEliminar) return;
    setIsDeleting(true);
    try {
      if (vehiculoParaEliminar.estado === 'vendido' || vehiculoParaEliminar.estado === 'reventa') {
        await vehiculosApi.deleteUnified(vehiculoParaEliminar.id);
      } else {
        await vehiculosApi.delete(vehiculoParaEliminar.id);
      }
      setVehiculos(prev => prev.filter(v => v.id !== vehiculoParaEliminar.id));
      setVehiculoParaEliminar(null);
      setFetchTrigger(prev => prev + 1); // Recargar estadísticas
    } catch (error) {
      console.error("Error al eliminar el vehículo", error);
    } finally {
      setIsDeleting(false);
    }
  }

  // Paginación, Búsqueda y Filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<'todos' | 'disponible' | 'vendido' | 'reventa'>('todos');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced Filters State
  const [stats, setStats] = useState<any>(null);
  const [precioRango, setPrecioRango] = useState<[number, number]>([0, 100000]);
  const [kmRango, setKmRango] = useState<[number, number]>([0, 200000]);
  const [anioRango, setAnioRango] = useState<[number, number]>([2000, new Date().getFullYear()]);
  const [filterTransmision, setFilterTransmision] = useState<string>('');
  const [filterTraccion, setFilterTraccion] = useState<string>('Todas');
  const [filterTipo, setFilterTipo] = useState<string>('Todos');
  const [filterCondicion, setFilterCondicion] = useState<string>('Todas');
  const [appliedFilters, setAppliedFilters] = useState<{
    precioRango: [number, number];
    kmRango: [number, number];
    anioRango: [number, number];
    filterTransmision: string;
    filterTraccion: string;
    filterTipo: string;
    filterCondicion: string;
  }>({
    precioRango: [0, 100000],
    kmRango: [0, 200000],
    anioRango: [2000, new Date().getFullYear()],
    filterTransmision: '',
    filterTraccion: 'Todas',
    filterTipo: 'Todos',
    filterCondicion: 'Todas'
  });
  const [fetchTrigger, setFetchTrigger] = useState(0);
  
  const size = 50;

  type SortConfig = {
    key: 'modelo' | 'kilometraje' | 'transmision' | 'traccion' | 'tipo' | 'condicion' | 'estado' | 'precio_venta' | 'etapa' | null;
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

  const renderEtapaBadge = (etapa: string) => {
    const mapping: Record<string, { label: string; className: string }> = {
      pre_compra: { label: 'Pre-Compra', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
      comprado: { label: 'Comprado', className: 'bg-blue-50 text-blue-700 border-blue-100' },
      en_stock: { label: 'En Stock', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      vendido: { label: 'Vendido', className: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    const info = mapping[etapa] || { label: etapa || '-', className: 'bg-gray-50 text-gray-600 border-gray-200' };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${info.className}`}>
        {info.label}
      </span>
    );
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
        filterTransmision: '',
        filterTraccion: 'Todas',
        filterTipo: 'Todos',
        filterCondicion: 'Todas'
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
      traccion: appliedFilters.filterTraccion === 'Todas' ? '' : appliedFilters.filterTraccion,
      tipo: appliedFilters.filterTipo === 'Todos' ? '' : appliedFilters.filterTipo,
      condicion: appliedFilters.filterCondicion === 'Todas' ? '' : appliedFilters.filterCondicion,
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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input 
            className="w-full pl-10 pr-4 h-11 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-on-surface placeholder:text-on-surface-variant" 
            placeholder="Buscar por marca, modelo o VIN..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`px-4 h-11 border rounded-xl flex items-center gap-2 transition-colors text-sm font-semibold cursor-pointer ${showAdvancedFilters ? 'bg-primary text-on-primary border-primary' : 'bg-surface border-outline-variant text-on-surface hover:bg-surface-container-high'}`}
        >
          <ListFilter size={20} />
          Filtros
        </button>

        {/* Tabs de Filtro de Estado */}
        <div className="flex bg-surface-container-low border border-outline-variant rounded-xl p-1 h-11">
          <button 
            onClick={() => setFilterEstado('todos')}
            className={`px-4 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1 cursor-pointer ${filterEstado === 'todos' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterEstado('disponible')}
            className={`px-4 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${filterEstado === 'disponible' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className={`w-2 h-2 rounded-full ${filterEstado === 'disponible' ? 'bg-primary' : 'bg-primary/50'}`}></span>
            Disponibles
          </button>
          <button 
            onClick={() => setFilterEstado('vendido')}
            className={`px-4 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${filterEstado === 'vendido' ? 'bg-surface-container-high text-error shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className={`w-2 h-2 rounded-full ${filterEstado === 'vendido' ? 'bg-error' : 'bg-error/50'}`}></span>
            Vendidos
          </button>
          <button 
            onClick={() => setFilterEstado('reventa')}
            className={`px-4 rounded-lg transition-colors text-sm font-semibold flex items-center gap-1.5 cursor-pointer ${filterEstado === 'reventa' ? 'bg-surface-container-high text-amber-400 shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className={`w-2 h-2 rounded-full ${filterEstado === 'reventa' ? 'bg-amber-400' : 'bg-amber-400/50'}`}></span>
            Reventa
          </button>
        </div>

        <div className="ml-auto flex items-center bg-surface-container-low border border-outline-variant rounded-xl p-1 h-11">
          <button 
            onClick={() => handleViewModeChange('list')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
            title="Vista de Lista"
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => handleViewModeChange('grid')}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-surface-container-high text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
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

            {/* Filtro: Tracción */}
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Tracción</label>
              <select 
                value={filterTraccion}
                onChange={(e) => setFilterTraccion(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              >
                <option value="Todas">Todas</option>
                <option value="4x2">4x2</option>
                <option value="4x4">4x4</option>
              </select>
            </div>

            {/* Filtro: Tipo */}
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Tipo</label>
              <select 
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              >
                <option value="Todos">Todos</option>
                <option value="Auto">Auto</option>
                <option value="Camioneta">Camioneta</option>
              </select>
            </div>

            {/* Filtro: Condición */}
            <div className="flex flex-col gap-1.5 justify-end">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">Condición</label>
              <select 
                value={filterCondicion}
                onChange={(e) => setFilterCondicion(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
              >
                <option value="Todas">Todas</option>
                <option value="Usado">Usado</option>
                <option value="Nuevo">Nuevo</option>
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
                  setFilterTraccion('Todas');
                  setFilterTipo('Todos');
                  setFilterCondicion('Todas');
                  setAppliedFilters({
                    precioRango: defaultPrecio,
                    kmRango: defaultKm,
                    anioRango: defaultAnio,
                    filterTransmision: 'Todas',
                    filterTraccion: 'Todas',
                    filterTipo: 'Todos',
                    filterCondicion: 'Todas'
                  });
                } else {
                  setPrecioRango([0, 100000]);
                  setKmRango([0, 200000]);
                  setAnioRango([2000, new Date().getFullYear()]);
                  setFilterTransmision('Todas');
                  setFilterTraccion('Todas');
                  setFilterTipo('Todos');
                  setFilterCondicion('Todas');
                  setAppliedFilters({
                    precioRango: [0, 100000],
                    kmRango: [0, 200000],
                    anioRango: [2000, new Date().getFullYear()],
                    filterTransmision: 'Todas',
                    filterTraccion: 'Todas',
                    filterTipo: 'Todos',
                    filterCondicion: 'Todas'
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
                  filterTransmision,
                  filterTraccion,
                  filterTipo,
                  filterCondicion
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
                    className="premium-card-hover bg-surface rounded-2xl border border-outline-variant overflow-hidden flex flex-col group cursor-pointer shadow-lg"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                      {v.imagenes && v.imagenes.length > 0 ? (
                        <img 
                          src={v.imagenes[0].ruta.trim()}
                          alt={v.modelo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ImageOff size={48} className="opacity-20" />
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${v.estado === 'disponible' ? 'bg-secondary-container text-secondary border-primary/20 shadow-sm' : v.estado === 'reventa' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-error-container text-error border-error/30'}`}>
                          {v.estado === 'disponible' ? 'Disponible' : v.estado === 'reventa' ? 'Reventa' : 'Vendido'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-lg font-bold text-on-surface leading-tight">{v.marca ? `${v.marca} ${v.modelo}` : v.modelo} <span className="text-on-surface-variant font-normal text-sm">({v.anio})</span></h3>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setVehiculoParaEliminar(v); }} 
                          className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar Vehículo"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      {/* Technical Info Subtitle */}
                      <div className="text-xs text-on-surface-variant mb-3 flex items-center flex-wrap gap-x-2 gap-y-1">
                        <span className="font-semibold text-on-surface">{v.condicion || 'Usado'}</span>
                        <span>•</span>
                        <span>{v.kilometraje.toLocaleString()} km</span>
                        <span>•</span>
                        <span>{v.transmision}</span>
                        {v.traccion && (
                          <>
                            <span>•</span>
                            <span>{v.traccion}</span>
                          </>
                        )}
                      </div>

                      {/* Commercial Modality Badge */}
                      <div className="mb-4">
                        {v.tipo_alta === 'consignacion' ? (
                          <div className="inline-flex flex-col bg-indigo-950/40 border border-indigo-800/40 rounded-xl px-2.5 py-1.5">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Consignación
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-300/80 mt-0.5">
                              Comisión: {v.comision_tipo === 'porcentaje' ? `${v.comision_valor}%` : `$${v.comision_valor?.toLocaleString()}`}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col bg-surface-container-low border border-outline-variant/50 rounded-xl px-2.5 py-1.5">
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Stock Propio
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-secondary font-black text-xl tracking-tight">${v.precio_venta.toLocaleString()}</span>
                        {v.estado === 'disponible' ? (
                          !isStock ? (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarcarVendido(v); }}
                              className="text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1.5 rounded-xl uppercase font-bold transition-colors cursor-pointer"
                            >
                              Marcar Vendido
                            </button>
                          ) : (
                            <span className="text-xs text-on-surface-variant uppercase font-semibold">Disponible</span>
                          )
                        ) : (
                          <span className="text-xs text-on-surface-variant uppercase font-semibold">{v.estado === 'reventa' ? 'Reventa' : 'Vendido'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="mt-8 overflow-x-auto bg-surface border border-outline-variant rounded-2xl shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-wider border-b border-outline-variant">
                    <th className="py-4 px-6">
                      <div onClick={() => handleSort('modelo')} className="flex items-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max">
                        Vehículo {renderSortIcon('modelo')}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1 cursor-default select-none w-max mx-auto text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                        Modalidad
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center">
                      <div onClick={() => handleSort('estado')} className="flex items-center justify-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max mx-auto">
                        Estado {renderSortIcon('estado')}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center">
                      <div onClick={() => handleSort('etapa')} className="flex items-center justify-center gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max mx-auto">
                        Fase {renderSortIcon('etapa')}
                      </div>
                    </th>
                    <th className="py-4 px-6 text-right">
                      <div onClick={() => handleSort('precio_venta')} className="flex items-center justify-end gap-1 cursor-pointer hover:text-on-surface transition-colors select-none w-max ml-auto">
                        Precio de Venta {renderSortIcon('precio_venta')}
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
                        className="hover:bg-surface-container-high transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6">
                          <div className="font-bold text-on-surface">{v.marca ? `${v.marca} ${v.modelo}` : v.modelo} <span className="font-normal text-on-surface-variant">({v.anio})</span></div>
                          <div className="text-xs text-on-surface-variant mt-1">
                            {v.condicion || 'Usado'} • {v.kilometraje.toLocaleString()} km • {v.transmision}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {v.tipo_alta === 'consignacion' ? (
                            <div className="inline-flex flex-col">
                              <span className="text-xs font-bold text-indigo-400 uppercase flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Consignación
                              </span>
                              <span className="text-[10px] font-semibold text-indigo-300/80 mt-0.5">
                                Comisión: {v.comision_tipo === 'porcentaje' ? `${v.comision_valor}%` : `$${v.comision_valor?.toLocaleString()}`}
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col">
                              <span className="text-xs font-bold text-on-surface-variant uppercase flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Stock Propio
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${v.estado === 'disponible' ? 'bg-secondary-container text-secondary border-primary/20' : v.estado === 'reventa' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-error-container text-error border-error/30'}`}>
                            {v.estado === 'disponible' ? 'Disponible' : v.estado === 'reventa' ? 'Reventa' : 'Vendido'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {renderEtapaBadge(v.etapa)}
                        </td>
                        <td className="py-4 px-6 font-bold text-secondary text-right text-base tracking-tight">${v.precio_venta.toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {v.estado === 'disponible' ? (
                              !isStock ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleMarcarVendido(v); }}
                                  className="text-xs bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 px-3 py-1.5 rounded-xl uppercase font-bold transition-colors w-32 whitespace-nowrap text-center cursor-pointer"
                                >
                                  Marcar Vendido
                                </button>
                              ) : (
                                <span className="text-xs text-on-surface-variant uppercase font-semibold w-32 whitespace-nowrap text-center px-3 py-1.5">Disponible</span>
                              )
                            ) : (
                              <span className="text-xs text-on-surface-variant uppercase font-semibold w-32 whitespace-nowrap text-center px-3 py-1.5">{v.estado === 'reventa' ? 'Reventa' : 'Vendido'}</span>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setVehiculoParaEliminar(v); }}
                              className="text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded-xl transition-colors cursor-pointer"
                              title="Eliminar Vehículo"
                            >
                              <Trash2 size={18} />
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

      <DeleteVehiculoModal 
        isOpen={!!vehiculoParaEliminar}
        onClose={() => setVehiculoParaEliminar(null)}
        vehiculo={vehiculoParaEliminar}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </section>
  )
}
