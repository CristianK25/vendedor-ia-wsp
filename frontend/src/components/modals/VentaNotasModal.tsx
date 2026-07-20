import { X, FileText } from 'lucide-react'
import { createPortal } from 'react-dom'

interface VentaNotasModalProps {
  isOpen: boolean
  onClose: () => void
  venta: any
}

export default function VentaNotasModal({ isOpen, onClose, venta }: VentaNotasModalProps) {
  if (!isOpen || !venta) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '512px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant/50 bg-surface-container-lowest">
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                <FileText size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Notas de Venta</h2>
                <p className="text-sm text-on-surface-variant">
                  {venta.vehiculo_modelo || 'Vehículo'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-on-surface-variant font-medium">
                <span>Cliente: {venta.cliente_nombre || venta.cliente_telefono}</span>
                <span>{new Date(venta.fecha).toLocaleDateString()}</span>
              </div>
              <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {venta.notas || 'No hay notas registradas para esta venta.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant/50 flex justify-end bg-surface-container-lowest">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
