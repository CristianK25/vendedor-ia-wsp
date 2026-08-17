import { useState, useEffect } from 'react';
import { 
  Plus, Wrench, Sparkles, Package, Truck, FileText, 
  ClipboardList, Paperclip, Trash2, Edit2, 
  AlertCircle, ShieldCheck, Calculator
} from 'lucide-react';
import type { ResumenGastosVehiculo, GastoVehiculo, CategoriaGasto } from '../../types/gasto';
import { gastosApi } from '../../api/gastos';
import GastoFormModal from '../modals/GastoFormModal';

interface GastosSectionProps {
  vehiculoId: number;
  precioCompra: number | null;
  monedaCompra: string | null;
}

const CATEGORIA_INFO: Record<CategoriaGasto, { label: string; icon: any; color: string }> = {
  mecanica: { label: 'Mecánica', icon: Wrench, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400' },
  detailing_preparacion: { label: 'Detailing / Prep.', icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 dark:text-purple-400' },
  repuestos: { label: 'Repuestos', icon: Package, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400' },
  flete: { label: 'Flete', icon: Truck, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400' },
  patentes_tramites: { label: 'Trámites', icon: FileText, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400' },
  otros: { label: 'Otros', icon: ClipboardList, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800/30 dark:text-gray-400' },
};

export default function GastosSection({ vehiculoId, precioCompra, monedaCompra }: GastosSectionProps) {
  const [resumen, setResumen] = useState<ResumenGastosVehiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<GastoVehiculo | null>(null);

  const fetchGastos = async () => {
    setLoading(true);
    try {
      const data = await gastosApi.getResumen(vehiculoId);
      setResumen(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la sección de gastos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehiculoId) {
      fetchGastos();
    }
  }, [vehiculoId]);

  const handleEdit = (gasto: GastoVehiculo) => {
    setSelectedGasto(gasto);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedGasto(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (gastoId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto? Esta acción borrará permanentemente el comprobante físico si existe.')) {
      try {
        await gastosApi.eliminar(gastoId);
        fetchGastos();
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Error al eliminar el gasto.');
      }
    }
  };

  const getComprobanteUrl = (ruta: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    if (!apiUrl || apiUrl.includes('//backend')) return ruta;
    return `${apiUrl}${ruta}`;
  };

  const formatMoneda = (valor: number, moneda: string = 'ARS') => {
    const symbol = moneda === 'USD' ? 'USD ' : '$ ';
    return `${symbol}${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && !resumen) {
    return (
      <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex justify-center items-center py-12">
        <span className="text-xs text-on-surface-variant flex items-center gap-2">
          Cargando costos...
        </span>
      </div>
    );
  }

  const listadoGastos = resumen?.gastos || [];
  const totalAcumulado = resumen?.total_gastos || 0;
  const totalFacturaA = resumen?.total_factura_a || 0;
  const ivaRecuperable = resumen?.iva_recuperable || 0;

  // Renderizador inteligente de Costo Real Total
  const renderCostoRealTotal = () => {
    if (precioCompra === null || precioCompra === undefined) {
      return <span className="font-mono text-base font-bold text-primary">{formatMoneda(totalAcumulado, 'ARS')}</span>;
    }

    if (monedaCompra === 'USD') {
      return (
        <div className="text-right">
          <p className="font-mono text-sm font-black text-primary">
            {formatMoneda(precioCompra, 'USD')}
          </p>
          {totalAcumulado > 0 && (
            <p className="font-mono text-xs text-on-surface-variant font-semibold mt-0.5">
              + {formatMoneda(totalAcumulado, 'ARS')}
            </p>
          )}
        </div>
      );
    }

    // Moneda de compra en pesos/ARS
    const total = precioCompra + totalAcumulado;
    return <span className="font-mono text-base font-black text-primary">{formatMoneda(total, 'ARS')}</span>;
  };

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-sm text-on-surface flex items-center gap-2">
          <Calculator size={16} className="text-primary"/>
          Costo Real y Gastos
        </h3>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold border border-primary/20 hover:border-primary/50 text-primary rounded-lg transition-all"
        >
          <Plus size={10} /> Cargar
        </button>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container text-xs p-3 rounded-xl border border-error/20 flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Desglose de Gastos Estilo Factura */}
      <div className="space-y-3.5 border-t border-b border-outline-variant/30 py-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-on-surface-variant font-semibold">Costo Compra</span>
          <span className="font-mono font-bold text-on-surface">
            {precioCompra !== null && precioCompra !== undefined
              ? formatMoneda(precioCompra, monedaCompra || 'ARS')
              : 'Sin registrar'}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-on-surface-variant font-semibold">Gastos de Preparación</span>
          <span className="font-mono font-bold text-on-surface">
            {formatMoneda(totalAcumulado, 'ARS')}
          </span>
        </div>

        {totalFacturaA > 0 && (
          <>
            <div className="flex justify-between items-center text-xs text-on-surface-variant">
              <span className="font-semibold">Total Facturado (A)</span>
              <span className="font-mono font-bold">
                {formatMoneda(totalFacturaA, 'ARS')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-green-600 dark:text-green-400">
              <span className="font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} className="shrink-0" />
                IVA Crédito Fiscal (21%)
              </span>
              <span className="font-mono font-bold">
                {formatMoneda(ivaRecuperable, 'ARS')}
              </span>
            </div>
          </>
        )}

        <div className="flex justify-between items-start pt-3 border-t border-outline-variant/20">
          <span className="font-extrabold text-sm text-on-surface mt-0.5">Costo Real Total</span>
          {renderCostoRealTotal()}
        </div>
      </div>

      {/* Listado de Gastos */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Detalle de Egresos</p>
        
        {listadoGastos.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-outline-variant/50 rounded-xl bg-surface-container-lowest">
            <ClipboardList className="mx-auto text-on-surface-variant/40 mb-2" size={24} />
            <p className="text-xs text-on-surface-variant">No se registraron gastos de preparación.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {listadoGastos.map(g => {
              const cat = CATEGORIA_INFO[g.categoria] || CATEGORIA_INFO.otros;
              const Icon = cat.icon;
              
              return (
                <div 
                  key={g.id} 
                  className="group py-2.5 px-3 hover:bg-surface-container-low rounded-xl transition-all flex justify-between items-center gap-2 border border-transparent hover:border-outline-variant/20"
                >
                  <div className="flex gap-2.5 items-center min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${cat.color}`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-on-surface truncate max-w-[130px]">
                          {g.proveedor}
                        </span>
                        {g.factura_a && (
                          <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[8px] font-bold uppercase tracking-wide border border-green-200/30">
                            F.A
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        {new Date(g.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-on-surface font-mono">
                      {formatMoneda(g.monto, 'ARS')}
                    </span>
                    
                    <div className="flex gap-1 ml-1.5">
                      {g.comprobante_url && (
                        <a 
                          href={getComprobanteUrl(g.comprobante_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-on-surface-variant hover:text-primary rounded transition-colors"
                          title="Ver Comprobante"
                        >
                          <Paperclip size={13} />
                        </a>
                      )}
                      <button
                        onClick={() => handleEdit(g)}
                        className="p-1 text-on-surface-variant hover:text-primary rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1 text-on-surface-variant hover:text-error rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      <GastoFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        vehiculoId={vehiculoId}
        gasto={selectedGasto}
        onSuccess={fetchGastos}
      />
    </div>
  );
}
