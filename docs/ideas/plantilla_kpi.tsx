{/* Plantilla de Componente/Estilos para KPIs (Bento Style) */}

{/* Grid Contenedor para 4 columnas (ajustable) */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  
  {/* Tarjeta Individual 1 (Ejemplo: Color primario para resaltar) */}
  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Ventas Mes</span>
    <div className="flex items-end justify-between mt-2">
      <span className="text-3xl font-bold text-primary">€142,500</span>
      <span className="text-emerald-600 text-xs font-semibold flex items-center bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
    </div>
  </div>

  {/* Tarjeta Individual 2 (Estilo Estándar con tendencia positiva) */}
  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Nuevos Clientes</span>
    <div className="flex items-end justify-between mt-2">
      <span className="text-3xl font-bold text-on-surface">24</span>
      <span className="text-emerald-600 text-xs font-semibold flex items-center bg-emerald-50 px-2 py-1 rounded-full">+4%</span>
    </div>
  </div>

  {/* Tarjeta Individual 3 (Estilo con tendencia negativa/alerta) */}
  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Tasa Conversión</span>
    <div className="flex items-end justify-between mt-2">
      <span className="text-3xl font-bold text-on-surface">18.2%</span>
      <span className="text-on-error-container text-xs font-semibold flex items-center bg-error-container px-2 py-1 rounded-full">-2%</span>
    </div>
  </div>

  {/* Tarjeta Individual 4 (Estilo con Badge informativo neutral) */}
  <div className="bg-white border border-outline-variant p-5 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Lead Score Promedio</span>
    <div className="flex items-end justify-between mt-2">
      <span className="text-3xl font-bold text-on-surface">84</span>
      <span className="text-primary text-xs font-semibold flex items-center bg-primary-container/20 px-2 py-1 rounded-full">Top</span>
    </div>
  </div>

</div>
