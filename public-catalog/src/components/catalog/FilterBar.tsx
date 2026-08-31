import { ShieldCheck, RefreshCw, FileText } from "lucide-react";

export default function FilterBar() {
  return (
    <section className="max-w-container-max mx-auto px-8 md:px-margin-page py-16 flex flex-col items-center gap-10 border-b border-outline-variant/30">
      
      {/* Barra de Confianza / Beneficios (Ahora arriba) */}
      <div className="flex gap-8 md:gap-12 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant flex-wrap justify-center w-full">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-primary" size={20} strokeWidth={1.5} />
          <span>Inspección Garantizada</span>
        </div>
        <div className="flex items-center gap-3">
          <RefreshCw className="text-primary" size={20} strokeWidth={1.5} />
          <span>Tomamos tu usado</span>
        </div>
        <div className="flex items-center gap-3">
          <FileText className="text-primary" size={20} strokeWidth={1.5} />
          <span>Gestoría Propia</span>
        </div>
      </div>

      {/* 
        TODO (Interactividad Faltante):
        1. Estos botones deben manejar el estado activo (ej: const [categoria, setCategoria] = useState('todos')).
        2. Al hacer clic, deben filtrar la lista de vehículos que se le pase al VehicleGrid.
      */}
      <div className="flex gap-8 font-label-sm text-label-sm uppercase tracking-widest overflow-x-auto w-full justify-center pb-2 md:pb-0 scrollbar-hide">
        <button className="text-primary border-b-2 border-primary pb-2 font-bold whitespace-nowrap">
          Todos
        </button>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors pb-2 whitespace-nowrap">
          Autos
        </button>
        <button className="text-on-surface-variant hover:text-on-surface transition-colors pb-2 whitespace-nowrap">
          Camionetas/SUVs
        </button>
      </div>

    </section>
  );
}
