import { useEffect, useState } from 'react'
import { Car, ImageOff, MessageCircle, AlertCircle, Search } from 'lucide-react'
import { publicCatalogApi, type PublicVehiculo } from '../api/publicCatalog'
import { CATALOG_CONFIG } from '../config/catalogConfig'

export default function PublicCatalogPage() {
  const [vehiculos, setVehiculos] = useState<PublicVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para Búsqueda y Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('Todos')

  // Debounce para el buscador (espera 300ms después de que el usuario deja de escribir)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  useEffect(() => {
    // Ya no forzamos el tema del CRM aquí, el catálogo tendrá sus propios estilos fijos (Dark Minimalism)
    setLoading(true)
    publicCatalogApi.getVehiculos()
      .then((data) => {
        setVehiculos(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error al cargar catálogo:', err)
        setError('No pudimos cargar el catálogo en este momento. Por favor, reintenta en unos instantes.')
        setLoading(false)
      })
  }, [])

  // Filtrado complejo de vehículos
  const filteredVehiculos = vehiculos.filter((v) => {
    // 1. Filtro por Píldoras
    if (filtroActivo !== 'Todos') {
      const tipo = (v.tipo || '').toLowerCase()
      if (filtroActivo === 'Autos' && tipo !== 'auto') return false
      if (filtroActivo === 'Camionetas' && tipo !== 'camioneta') return false
    }

    // 2. Filtro por Buscador (Multipalabra)
    if (debouncedSearchTerm.trim() !== '') {
      const searchWords = debouncedSearchTerm.toLowerCase().trim().split(/\s+/)
      const carString = `${v.marca || ''} ${v.modelo || ''} ${v.anio || ''}`.toLowerCase()
      
      // Tiene que coincidir con TODAS las palabras que el usuario escribió (ej: "Toyota 2022")
      const matchesAll = searchWords.every(word => carString.includes(word))
      if (!matchesAll) return false
    }

    return true
  })

  return (
    <div className="bg-[#141414] text-[#B0B0B0] min-h-screen flex flex-col font-sans">
      {/* Cabecera Pública Minimalista */}
      <header className="sticky top-0 z-50 bg-[#1C1C1C] border-b border-[#3D3D3D] w-full overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 w-full max-w-[1600px] mx-auto">
          {/* Logo de la Concesionaria */}
          <div className="flex items-center h-full">
            <img 
              src="/LVMautomotores.jpg" 
              alt="LVM Automotores" 
              className="h-full object-contain mix-blend-screen scale-[2] md:scale-[2.6] origin-left"
            />
          </div>

          {/* Acciones de la cabecera (Redes y Contacto) */}
          <div className="flex items-center gap-4 md:gap-6">
            <a
              href="https://www.instagram.com/lvmautomotores/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E0E0E0] hover:text-[#FFFFFF] transition-colors"
              title="Síguenos en Instagram"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>

            <a
              href={`https://wa.me/${CATALOG_CONFIG.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre los vehículos en catálogo.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E0E0E0] hover:text-[#FFFFFF] transition-colors"
              title="Contactanos por Whatsapp"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="22" 
                height="22" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 w-full px-4 md:px-10 py-8 max-w-[1600px] mx-auto flex flex-col">
        {/* Sección Hero: Bienvenida, Buscador y Filtros */}
        <div className="mb-14 mt-4 flex flex-col items-center text-center w-full">
          <h1 className="text-3xl md:text-5xl font-extrabold text-[#E0E0E0] tracking-tight mb-3">
            Encontrá tu próximo vehículo
          </h1>
          <p className="text-sm md:text-base text-zinc-400 mb-8 w-full max-w-[600px] mx-auto">
            Explorá nuestro catálogo de autos y camionetas seleccionadas. Consultá disponibilidad directamente por WhatsApp.
          </p>

          {/* Buscador */}
          <div className="w-full max-w-[500px] relative mb-6">
            <input 
              type="text" 
              placeholder="Buscar por marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1C1C1C] border border-[#3D3D3D] text-[#B0B0B0] rounded-full py-3.5 px-6 pl-12 focus:outline-none focus:border-[#7D7D7D] focus:ring-1 focus:ring-[#7D7D7D] transition-all placeholder:text-[#7D7D7D]"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7D7D7D]" size={20} />
          </div>

          {/* Filtros Rápidos (Píldoras) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Todos', 'Autos', 'Camionetas'].map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroActivo(filtro)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filtroActivo === filtro 
                    ? 'bg-[#B0B0B0] text-[#000000]' 
                    : 'bg-[#1C1C1C] text-[#7D7D7D] border border-[#3D3D3D] hover:bg-[#3D3D3D] hover:text-[#B0B0B0]'
                }`}
              >
                {filtro}
              </button>
            ))}
          </div>
        </div>

        {/* Estado: Cargando */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-[#7D7D7D] gap-3">
            <div className="w-10 h-10 border-4 border-[#3D3D3D] border-t-[#B0B0B0] rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Cargando inventario de vehículos...</p>
          </div>
        )}

        {/* Estado: Error */}
        {error && !loading && (
          <div className="bg-error-container/20 border border-error/30 text-error p-6 rounded-2xl flex items-center gap-4 max-w-lg mx-auto my-12">
            <AlertCircle size={28} className="shrink-0" />
            <div>
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-bold underline cursor-pointer hover:opacity-80"
              >
                Volver a intentar
              </button>
            </div>
          </div>
        )}

        {/* Estado: Sin Vehículos */}
        {!loading && !error && vehiculos.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
              <Car size={32} className="opacity-40" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">No hay vehículos disponibles</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
              En este momento no hay unidades en stock para venta directa. Por favor, consultanos por WhatsApp para futuros ingresos.
            </p>
          </div>
        )}

        {/* Grilla de Tarjetas (Monocromática Minimalista) */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredVehiculos.length > 0 ? (
              filteredVehiculos.map((v) => {
                const whatsappLink = CATALOG_CONFIG.obtenerEnlaceWhatsApp(v)
                const titulo = v.marca ? `${v.marca} ${v.modelo}` : v.modelo

              return (
                <div
                  key={v.id}
                  className="bg-[#1C1C1C] rounded-2xl border border-[#3D3D3D] overflow-hidden flex flex-col group transition-all hover:border-[#7D7D7D]"
                >
                  {/* Foto de portada */}
                  <div className="relative h-56 w-full overflow-hidden bg-[#000000] flex items-center justify-center text-[#3D3D3D]">
                    {v.imagenes && v.imagenes.length > 0 ? (
                      <img
                        src={v.imagenes[0].ruta.trim()}
                        alt={titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <ImageOff size={48} className="opacity-20" />
                    )}
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-5 flex flex-col flex-1 text-center items-center">
                    <div className="mb-3 w-full">
                      <h3 className="text-lg font-bold text-[#E0E0E0] leading-tight">
                        {titulo}
                      </h3>
                    </div>

                    {/* Especificaciones Técnicas */}
                    <div className="text-sm font-medium text-[#7D7D7D] mb-6 flex items-center justify-center flex-wrap gap-2 w-full">
                      <span>{v.anio}</span>
                      <span className="text-[#3D3D3D]">|</span>
                      <span>{v.kilometraje.toLocaleString()} km</span>
                      <span className="text-[#3D3D3D]">|</span>
                      <span>{v.transmision}</span>
                      {v.traccion && (
                        <>
                          <span className="text-[#3D3D3D]">|</span>
                          <span>{v.traccion}</span>
                        </>
                      )}
                    </div>

                    {/* Precio y Botón de Contacto WhatsApp */}
                    <div className="mt-auto pt-4 border-t border-[#3D3D3D] flex flex-col gap-4 w-full">
                      <span className="text-[#E0E0E0] font-extrabold text-2xl tracking-tight">
                        {v.moneda_venta === 'USD' ? 'U$S' : '$'}{v.precio_venta.toLocaleString()} <span className="text-sm font-normal text-[#7D7D7D]">{v.moneda_venta === 'USD' ? 'USD' : 'ARS'}</span>
                      </span>
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-center border border-[#3D3D3D] hover:border-[#E0E0E0] bg-transparent text-[#E0E0E0] hover:text-[#FFFFFF] px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2"
                        title="Contactar por WhatsApp"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                        <span>Contactar</span>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full py-12 text-center text-[#7D7D7D]">
              No se encontraron vehículos que coincidan con tu búsqueda.
            </div>
          )}
          </div>
        )}
      </main>

      {/* Pie de página Minimalista */}
      <footer className="border-t border-[#3D3D3D] bg-[#1C1C1C] mt-12 py-12">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
          
          {/* Información de la Marca */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="text-[#B0B0B0] font-black text-xl tracking-tighter uppercase mb-1">
              LVM Automotores
            </span>
            <span className="text-[#7D7D7D] text-sm">
              Catálogo de unidades seleccionadas.
            </span>
          </div>

          {/* Enlaces Rápidos (Redes y Contacto) */}
          <div className="flex items-center gap-8">
            <a
              href="https://www.instagram.com/lvmautomotores/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7D7D7D] hover:text-[#B0B0B0] transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </a>
            <a
              href={`https://wa.me/${CATALOG_CONFIG.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría consultar por sus vehículos disponibles.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7D7D7D] hover:text-[#B0B0B0] transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>

        {/* Copyright y Ubicación */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 mt-12 pt-6 border-t border-[#3D3D3D] text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#7D7D7D]">
          <p>© {new Date().getFullYear()} {CATALOG_CONFIG.concesionariaNombre}. Todos los derechos reservados.</p>
          <p>Mendoza, Argentina</p>
        </div>
      </footer>
    </div>
  )
}
