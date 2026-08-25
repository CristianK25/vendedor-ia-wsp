import { useState, useEffect } from 'react'
import { X, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { ventasApi } from '../../api/ventas'

interface DeleteVehiculoModalProps {
  isOpen: boolean
  onClose: () => void
  vehiculo: any
  onConfirm: () => void
  isDeleting: boolean
}

export default function DeleteVehiculoModal({ isOpen, onClose, vehiculo, onConfirm, isDeleting }: DeleteVehiculoModalProps) {
  const [ventaData, setVentaData] = useState<any>(null)
  const [loadingVenta, setLoadingVenta] = useState(false)

  useEffect(() => {
    if (isOpen && vehiculo && (vehiculo.estado === 'vendido' || vehiculo.estado === 'reventa')) {
      setLoadingVenta(true)
      ventasApi.getByVehiculoId(vehiculo.id)
        .then(data => setVentaData(data))
        .catch(err => console.error("Error fetching venta:", err))
        .finally(() => setLoadingVenta(false))
    } else {
      setVentaData(null)
    }
  }, [isOpen, vehiculo])

  if (!isOpen || !vehiculo) return null

  const isVendido = vehiculo.estado === 'vendido' || vehiculo.estado === 'reventa'

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '512px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isVendido ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className={`p-2.5 rounded-full ${isVendido ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                {isVendido ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isVendido ? 'text-amber-500' : 'text-red-500'}`}>
                  {isVendido ? 'Eliminación Unificada' : 'Eliminar Vehículo'}
                </h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {vehiculo.marca ? `${vehiculo.marca} ${vehiculo.modelo}` : vehiculo.modelo} - {vehiculo.patente}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isVendido ? (
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Este vehículo tiene una <strong className="text-on-surface">transacción comercial asociada</strong> (Venta). 
              </p>
              
              {loadingVenta ? (
                <div className="flex justify-center items-center py-4 text-amber-500">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : ventaData ? (
                <div className="bg-surface-container-lowest border border-amber-500/30 p-4 rounded-xl space-y-2 shadow-xs">
                  <h4 className="font-bold text-amber-500 text-sm">Detalles de la Venta a Anular:</h4>
                  <ul className="text-sm text-on-surface space-y-1">
                    <li><span className="text-on-surface-variant font-medium">Cliente:</span> {ventaData.cliente_nombre ? `${ventaData.cliente_nombre} (${ventaData.cliente_telefono})` : ventaData.cliente_telefono}</li>
                    <li><span className="text-on-surface-variant font-medium">Fecha:</span> {new Date(ventaData.fecha).toLocaleDateString()}</li>
                    <li><span className="text-on-surface-variant font-medium">Monto Final:</span> ${ventaData.precio_final?.toLocaleString()}</li>
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-red-500 font-medium">No se pudo cargar la venta asociada.</p>
              )}

              <p className="text-on-surface-variant text-sm leading-relaxed">
                Para mantener la integridad contable, la venta pasará a un estado de <strong className="text-on-surface">"Anulada" (Soft Delete)</strong> y el vehículo se eliminará visualmente del catálogo.
              </p>
              <p className="text-on-surface text-sm font-semibold mt-2">
                ¿Desea anular la venta y eliminar el vehículo?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                El vehículo se eliminará visualmente del catálogo y <strong className="text-on-surface">sus imágenes físicas serán borradas</strong> para ahorrar almacenamiento.
              </p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Por cuestiones de seguridad y auditoría, los datos en texto del registro se mantendrán internamente en la base de datos de forma oculta.
              </p>
              <p className="text-on-surface text-sm font-semibold mt-2">
                ¿Desea continuar con la eliminación?
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant flex gap-3 justify-end bg-surface-container-lowest">
          {isVendido ? (
            <>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting || loadingVenta}
                className="px-5 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Procesando...' : 'Sí, Anular Venta y Eliminar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
