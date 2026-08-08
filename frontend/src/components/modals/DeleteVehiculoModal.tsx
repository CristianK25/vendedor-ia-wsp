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
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '512px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${isVendido ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'}`}>
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className={`p-2 rounded-full ${isVendido ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                {isVendido ? <ShieldAlert size={24} /> : <AlertTriangle size={24} />}
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isVendido ? 'text-orange-900' : 'text-red-900'}`}>
                  {isVendido ? 'Eliminación Unificada' : 'Eliminar Vehículo'}
                </h2>
                <p className={`text-sm ${isVendido ? 'text-orange-700' : 'text-red-700'}`}>
                  {vehiculo.marca ? `${vehiculo.marca} ${vehiculo.modelo}` : vehiculo.modelo} - {vehiculo.patente}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className={`p-1 hover:bg-white/50 rounded-lg transition-colors ${isVendido ? 'text-orange-700' : 'text-red-700'}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isVendido ? (
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Este vehículo tiene una <strong>transacción comercial asociada</strong> (Venta). 
              </p>
              
              {loadingVenta ? (
                <div className="flex justify-center items-center py-4 text-orange-600">
                  <Loader2 className="animate-spin" size={24} />
                </div>
              ) : ventaData ? (
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl space-y-2">
                  <h4 className="font-bold text-orange-900 text-sm">Detalles de la Venta a Anular:</h4>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li><strong>Cliente:</strong> {ventaData.cliente_nombre ? `${ventaData.cliente_nombre} (${ventaData.cliente_telefono})` : ventaData.cliente_telefono}</li>
                    <li><strong>Fecha:</strong> {new Date(ventaData.fecha).toLocaleDateString()}</li>
                    <li><strong>Monto Final:</strong> ${ventaData.precio_final?.toLocaleString()}</li>
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-red-600">No se pudo cargar la venta asociada.</p>
              )}

              <p className="text-on-surface-variant text-sm leading-relaxed">
                Para mantener la integridad contable, la venta pasará a un estado de <strong>"Anulada" (Soft Delete)</strong> y el vehículo se eliminará visualmente del catálogo.
              </p>
              <p className="text-surface-900 text-sm font-semibold mt-2">
                ¿Desea anular la venta y eliminar el vehículo?
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-on-surface-variant text-sm leading-relaxed">
                El vehículo se eliminará visualmente del catálogo y <strong>sus imágenes físicas serán borradas</strong> para ahorrar almacenamiento.
              </p>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Por cuestiones de seguridad y auditoría, los datos en texto del registro se mantendrán internamente en la base de datos de forma oculta.
              </p>
              <p className="text-surface-900 text-sm font-semibold mt-2">
                ¿Desea continuar con la eliminación?
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant/50 flex gap-3 justify-end bg-surface-container-lowest">
          {isVendido ? (
            <>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting || loadingVenta}
                className="px-5 py-2.5 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? 'Procesando...' : 'Sí, Anular Venta y Eliminar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
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
