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
  const [filtroActivo, setFiltroActivo] = useState('Todos')

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

  return (
    <div className="bg-black text-white min-h-screen flex flex-col font-sans">
      {/* Cabecera Pública Minimalista */}
      <header className="sticky top-0 z-50 bg-black border-b border-zinc-900 w-full overflow-hidden">
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
              className="text-white/70 hover:text-white transition-colors"
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
              className="text-white/70 hover:text-white transition-colors"
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
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
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
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-full py-3.5 px-6 pl-12 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-500"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          </div>

          {/* Filtros Rápidos (Píldoras) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {['Todos', 'Autos', 'Camionetas', 'SUVs'].map((filtro) => (
              <button
                key={filtro}
                onClick={() => setFiltroActivo(filtro)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  filtroActivo === filtro 
                    ? 'bg-white text-black' 
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                {filtro}
              </button>
            ))}
          </div>
        </div>

        {/* Estado: Cargando */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-on-surface-variant gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
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

        {/* Grilla de Tarjetas (Mismo diseño de /vehiculos) */}
        {!loading && !error && vehiculos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehiculos.map((v) => {
              const whatsappLink = CATALOG_CONFIG.obtenerEnlaceWhatsApp(v)
              const titulo = v.marca ? `${v.marca} ${v.modelo}` : v.modelo

              return (
                <div
                  key={v.id}
                  className="premium-card-hover bg-surface rounded-2xl border border-outline-variant overflow-hidden flex flex-col group shadow-lg transition-all"
                >
                  {/* Foto de portada */}
                  <div className="relative h-48 w-full overflow-hidden bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                    {v.imagenes && v.imagenes.length > 0 ? (
                      <img
                        src={v.imagenes[0].ruta.trim()}
                        alt={titulo}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageOff size={48} className="opacity-20" />
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-secondary-container text-secondary border-primary/20 shadow-sm">
                        Disponible
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-on-surface leading-tight">
                        {titulo}{' '}
                        <span className="text-on-surface-variant font-normal text-sm">
                          ({v.anio})
                        </span>
                      </h3>
                    </div>

                    {/* Especificaciones Técnicas */}
                    <div className="text-xs text-on-surface-variant mb-4 flex items-center flex-wrap gap-x-2 gap-y-1">
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

                    {/* Precio y Botón de Contacto WhatsApp */}
                    <div className="mt-auto pt-3 border-t border-outline-variant/50 flex items-center justify-between gap-2">
                      <span className="text-secondary font-black text-xl tracking-tight">
                        ${v.precio_venta.toLocaleString()} {v.moneda_venta === 'USD' ? 'USD' : 'ARS'}
                      </span>
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
                        title="Consultar por WhatsApp"
                      >
                        <MessageCircle size={15} />
                        <span>Consultar</span>
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Pie de página sutil */}
      <footer className="border-t border-outline-variant py-6 text-center text-xs text-on-surface-variant bg-surface-container-lowest">
        <p>© {new Date().getFullYear()} {CATALOG_CONFIG.concesionariaNombre}. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
