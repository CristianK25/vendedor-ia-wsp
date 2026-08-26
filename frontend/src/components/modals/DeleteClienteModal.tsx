import { X, Trash2, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'

interface DeleteClienteModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: any
  onConfirm: () => void
  isDeleting: boolean
}

export default function DeleteClienteModal({
  isOpen,
  onClose,
  cliente,
  onConfirm,
  isDeleting
}: DeleteClienteModalProps) {
  if (!isOpen || !cliente) return null

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden flex flex-col shrink-0"
        style={{ width: '100%', maxWidth: '512px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-red-500/20 bg-red-500/10">
          <div className="flex justify-between items-start">
            <div className="flex gap-3 items-center">
              <div className="p-2.5 rounded-full bg-red-500/20 text-red-500 shrink-0">
                <Trash2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-500">
                  Eliminar Cliente
                </h2>
                <p className="text-sm text-on-surface-variant mt-0.5">
                  {cliente.nombre || 'Cliente sin nombre'} ({cliente.telefono})
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface cursor-pointer disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-on-surface-variant text-sm leading-relaxed">
            ¿Estás seguro de que deseas eliminar al cliente <strong className="text-on-surface">{cliente.nombre || cliente.telefono}</strong>?
          </p>
          <div className="bg-surface-container-lowest border border-outline-variant/60 p-4 rounded-xl space-y-1.5 text-xs text-on-surface-variant">
            <p>• El cliente ya no aparecerá en el listado activo del CRM.</p>
            <p>• Los registros históricos de compras o interacciones previas se conservarán para fines contables y de auditoría.</p>
            <p>• Si el cliente vuelve a enviar un mensaje por WhatsApp, su cuenta se reactivará automáticamente.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-outline-variant flex gap-3 justify-end bg-surface-container-lowest">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
            {isDeleting ? 'Eliminando...' : 'Sí, Eliminar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
