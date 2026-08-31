export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30">
      <div className="flex justify-between items-center px-8 md:px-margin-page h-24 w-full max-w-container-max mx-auto">
        <div className="font-display-lg text-headline-md tracking-tighter text-on-surface">
          LVM AUTOMOTORES
        </div>
        
        <ul className="hidden md:flex gap-element-gap items-center font-body-md text-body-md uppercase tracking-widest">
          <li>
            <a 
              className="text-primary font-bold border-b-2 border-primary pb-1 hover:opacity-80 transition-all active:scale-95 duration-150" 
              href="#"
            >
              Inventario
            </a>
          </li>
          <li>
            <a 
              className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80 active:scale-95 duration-150" 
              href="#"
            >
              Servicios
            </a>
          </li>
          <li>
            <a 
              className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80 active:scale-95 duration-150" 
              href="#"
            >
              Contacto
            </a>
          </li>
        </ul>

        {/* 
          TODO (Interactividad Faltante):
          1. El botón de consultar debería abrir un modal o redirigir al WhatsApp general.
          2. Falta el menú hamburguesa para la versión móvil (el ul actual tiene "hidden md:flex").
        */}
        <button className="font-body-md text-body-md uppercase tracking-widest text-primary hover:opacity-80 transition-all active:scale-95 duration-150 border border-primary px-6 py-3 hidden md:block">
          Consultar
        </button>
      </div>
    </nav>
  );
}
