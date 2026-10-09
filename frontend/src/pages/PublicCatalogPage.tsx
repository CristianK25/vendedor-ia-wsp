import { useEffect, useState } from 'react'
import { Car, ImageOff, MessageCircle, AlertCircle } from 'lucide-react'
import { publicCatalogApi, type PublicVehiculo } from '../api/publicCatalog'
import { CATALOG_CONFIG } from '../config/catalogConfig'

export default function PublicCatalogPage() {
  const [vehiculos, setVehiculos] = useState<PublicVehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Asegurar que el tema oscuro esté activo en el catálogo
    const savedTheme = localStorage.getItem('autolead_theme') || 'aston-martin'
    document.documentElement.setAttribute('data-theme', savedTheme)

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
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-sans">
      {/* Cabecera Pública Aislada (Sin menú ni login del CRM) */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant w-full shadow-md">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 w-full max-w-[1600px] mx-auto">
          {/* Logo y Nombre de la Concesionaria */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Car size={22} />
            </div>
            <div>
              <span className="text-lg md:text-xl font-extrabold text-primary tracking-tight block leading-tight">
                {CATALOG_CONFIG.concesionariaNombre}
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium tracking-wider uppercase block">
                Catálogo Oficial de Vehículos
              </span>
            </div>
          </div>

          {/* Contacto directo por WhatsApp en la cabecera */}
          <a
            href={`https://wa.me/${CATALOG_CONFIG.whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('¡Hola! Me gustaría hacer una consulta sobre los vehículos en catálogo.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs md:text-sm font-bold transition-all active:scale-95 shadow-sm"
          >
            <MessageCircle size={17} />
            <span className="hidden sm:inline">Contactar por WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 w-full px-4 md:px-10 py-8 max-w-[1600px] mx-auto flex flex-col">
        {/* Título de sección */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                Vehículos Disponibles
              </h1>
              <p className="text-sm md:text-base text-on-surface-variant mt-1">
                Explora nuestras unidades seleccionadas y consultá directamente por WhatsApp.
              </p>
            </div>
            {!loading && !error && (
              <span className="text-xs md:text-sm font-semibold px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface-variant border border-outline-variant w-fit">
                {vehiculos.length} {vehiculos.length === 1 ? 'unidad disponible' : 'unidades disponibles'}
              </span>
            )}
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
