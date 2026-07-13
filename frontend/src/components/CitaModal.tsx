import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Cita, Cliente } from '../types/models';
import { clientesApi } from '../api/clientes';
import { citasApi } from '../api/citas';

interface CitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cita: Cita | null;
  onUpdate: (updatedCita: Cita) => void;
}

export default function CitaModal({ isOpen, onClose, cita, onUpdate }: CitaModalProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && cita?.cliente_telefono) {
      setLoading(true);
      clientesApi.getByTelefono(cita.cliente_telefono)
        .then(data => setCliente(data))
        .catch(err => console.error("Error fetching cliente:", err))
        .finally(() => setLoading(false));
    } else {
      setCliente(null);
    }
  }, [isOpen, cita]);

  if (!isOpen || !cita) return null;

  const handleUpdateEstado = async (nuevoEstado: 'confirmada' | 'cancelada') => {
    try {
      setIsUpdating(true);
      const updated = await citasApi.update(cita.id, { estado: nuevoEstado });
      onUpdate(updated);
      onClose();
    } catch (err) {
      console.error("Error al actualizar la cita:", err);
      alert("No se pudo actualizar el estado de la cita. Inténtalo de nuevo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const fechaCita = new Date(cita.fecha);
  const fechaCreacion = new Date(cita.fecha_creacion);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '380px', minHeight: '200px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-50 px-4 py-3 flex justify-between items-center border-b border-blue-100">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-blue-900">Detalles de la Cita</h2>
            {cita.estado === 'pendiente' && (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full uppercase">Pendiente</span>
            )}
            {cita.estado === 'confirmada' && (
              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full uppercase">Confirmada</span>
            )}
            {cita.estado === 'cancelada' && (
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full uppercase">Cancelada</span>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 bg-white rounded-full p-1 transition-colors"
            title="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {/* Cita Info */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Turno</h3>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-semibold text-gray-900">
                  {fechaCita.toLocaleDateString('es-ES')} {fechaCita.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}hs
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Estado:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                  cita.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 
                  cita.estado === 'cancelada' ? 'bg-red-100 text-red-700' : 
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {cita.estado}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1 pt-2 border-t border-gray-200">
                <span>Creado:</span>
                <span>{fechaCreacion.toLocaleDateString('es-ES')} {fechaCreacion.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}hs</span>
              </div>
            </div>
          </div>

          {/* Cliente Info */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</h3>
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-semibold text-gray-900 truncate" style={{ maxWidth: '180px' }}>
                  {cita.cliente_nombre || cliente?.nombre || 'Desconocido'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Teléfono:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{cita.cliente_telefono}</span>
                  <a 
                    href={`https://wa.me/${cita.cliente_telefono.replace('+', '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full p-1.5 transition-colors shadow-sm"
                    title="Abrir chat en WhatsApp"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-1">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              ) : cliente ? (
                <>
                  <div className="flex justify-between items-center text-[12px] pt-2 border-t border-blue-100/50 mt-1">
                    <span className="text-gray-500">Compras Realizadas:</span>
                    <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">{cliente.cantidad_compras}</span>
                  </div>
                  {cliente.ultima_interaccion_cliente && (
                    <div className="flex justify-between items-center text-[11px] text-gray-500">
                      <span>Última Interacción:</span>
                      <span>{new Date(cliente.ultima_interaccion_cliente).toLocaleDateString('es-ES')}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {/* Vehículo Info */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehículo de Interés</h3>
            <div className={`p-3 rounded-lg border text-sm flex flex-col gap-2 ${cita.vehiculo_id ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
              {cita.vehiculo_id ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-800 font-medium">Modelo:</span>
                    <span className="font-bold text-orange-900 truncate">{cita.vehiculo_modelo}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12px] pt-2 border-t border-orange-100/50 mt-1">
                    <span className="text-orange-700">Patente:</span>
                    <span className="font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-md">{cita.vehiculo_patente}</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500 italic py-1 text-xs">
                  Cita General (Sin vehículo específico)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center gap-2 border-t border-gray-200 mt-auto">
          {/* Botones de acción basados en el estado */}
          <div className="flex gap-2">
            {cita.estado === 'pendiente' && (
              <>
                <button
                  onClick={() => handleUpdateEstado('confirmada')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => handleUpdateEstado('cancelada')}
                  disabled={isUpdating}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Cancelar Cita
                </button>
              </>
            )}
            {cita.estado === 'confirmada' && (
              <button
                onClick={() => handleUpdateEstado('cancelada')}
                disabled={isUpdating}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Cancelar Cita
              </button>
            )}
            {cita.estado === 'cancelada' && (
              <span className="text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                Esta cita está cancelada
              </span>
            )}
          </div>

          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
