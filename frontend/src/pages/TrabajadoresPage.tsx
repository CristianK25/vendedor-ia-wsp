import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trabajadoresApi } from '../api/trabajadores'
import { Plus, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function TrabajadoresView() {
  const navigate = useNavigate()
  const { usuario } = useAuthStore()
  const [trabajadores, setTrabajadores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const size = 50;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setLoading(true)
    trabajadoresApi.getAll(currentPage, size, debouncedSearch)
      .then((data: any) => {
        setTrabajadores(data.items)
        setTotalPages(data.total_pages)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [currentPage, debouncedSearch])

  const handleDelete = async (id: number) => {
    if (usuario?.id === id) {
      alert('No puedes eliminar tu propia cuenta de usuario.')
      return
    }
    if (window.confirm('¿Está seguro de que desea eliminar este trabajador/usuario?')) {
      try {
        await trabajadoresApi.delete(id)
        setTrabajadores(prev => prev.filter(t => t.id !== id))
      } catch (err: any) {
        console.error('Error al eliminar trabajador:', err)
        alert(err.message || 'Error al eliminar trabajador')
      }
    }
  }

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
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Equipo de Trabajo</h2>
          <p className="text-base text-on-surface-variant mt-1">Gestiona el personal y los permisos de acceso al sistema.</p>
        </div>
        <button 
          onClick={() => navigate('/trabajadores/nuevo')}
          className="bg-primary hover:bg-primary-container text-on-primary px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus size={20} />
          Agregar Trabajador
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input 
            className="w-full pl-10 pr-4 h-11 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-on-surface placeholder:text-on-surface-variant" 
            placeholder="Buscar trabajador..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-on-surface-variant">Cargando equipo...</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trabajadores.length === 0 ? (
            <p className="text-on-surface-variant">No hay trabajadores registrados.</p>
          ) : (
            trabajadores.map(t => {
              const initials = t.nombre ? (t.apellido ? `${t.nombre[0]}${t.apellido[0]}`.toUpperCase() : t.nombre.substring(0, 2).toUpperCase()) : 'NN';
              const isSelf = usuario?.id === t.id;
              return (
                <div key={t.id} className="premium-card-hover bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col items-center group relative cursor-pointer shadow-xl">
                  <div className="absolute top-4 right-4 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1 hover:bg-surface-container-high rounded-full"><MoreVertical size={20}/></button>
                  </div>
                  <div className="w-20 h-20 bg-primary text-on-primary rounded-full flex items-center justify-center text-3xl font-black mb-4 shadow-md">
                    {initials}
                  </div>
                  <h3 className="font-bold text-lg text-on-surface">{t.nombre} {t.apellido}</h3>
                  <p className="text-on-surface-variant text-sm mt-1">{t.rol || 'Vendedor'}</p>
                  
                  <div className="mt-5 w-full bg-surface-container-lowest rounded-xl p-3 text-center border border-outline-variant">
                    <p className="text-on-surface font-semibold text-sm">{t.telefono || 'Sin teléfono'}</p>
                  </div>
                  
                  <div className="mt-5 flex gap-2.5 w-full">
                    <button 
                      onClick={() => navigate(`/trabajadores/editar/${t.id}`)}
                      className="flex-1 bg-surface-container-high border border-outline-variant text-on-surface py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-bright transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id)}
                      disabled={isSelf}
                      title={isSelf ? "No puedes eliminar tu propio usuario en sesión" : "Eliminar trabajador"}
                      className={`flex-1 border py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                        isSelf 
                          ? 'bg-surface-container-high border-outline-variant text-on-surface-variant opacity-40 cursor-not-allowed' 
                          : 'bg-error-container border-error/30 text-error hover:bg-error-container/80 cursor-pointer'
                      }`}
                    >
                      <Trash2 size={16} /> Eliminar
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
      
      {renderPagination()}
    </section>
  )
}
