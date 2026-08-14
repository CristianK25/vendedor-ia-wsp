import { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { etiquetasApi } from '../api/clientes';

export const PALETA_COLORES: Record<string, { bg: string; text: string; border: string; preview: string }> = {
  azul: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', preview: '#3b82f6' },
  verde: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', preview: '#22c55e' },
  naranja: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', preview: '#f97316' },
  rojo: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', preview: '#ef4444' },
  purpura: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', preview: '#a855f7' },
  rosa: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', preview: '#ec4899' },
  amarillo: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200', preview: '#eab308' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', preview: '#14b8a6' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', preview: '#6366f1' },
  gris: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', preview: '#64748b' }
};

interface EtiquetasModalProps {
  isOpen: boolean;
  onClose: () => void;
  etiquetas: any[];
  refreshEtiquetas: () => void;
}

export default function EtiquetasModal({ isOpen, onClose, etiquetas, refreshEtiquetas }: EtiquetasModalProps) {
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('verde');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [etiquetaToDelete, setEtiquetaToDelete] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!nombre.trim()) return;
    setIsSubmitting(true);
    try {
      await etiquetasApi.create({ nombre: nombre.trim(), color });
      setNombre('');
      setColor('verde');
      refreshEtiquetas();
    } catch (e: any) {
      alert(e.message || 'Error al crear la etiqueta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!etiquetaToDelete) return;
    try {
      await etiquetasApi.delete(etiquetaToDelete.id);
      setEtiquetaToDelete(null);
      refreshEtiquetas();
    } catch (e: any) {
      alert(e.message || 'Error al eliminar la etiqueta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface w-[95vw] max-w-[450px] min-w-[320px] rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-outline-variant">
          <h2 className="text-xl font-bold text-on-surface">Gestionar Etiquetas</h2>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          
          {/* Formulario Crear */}
          <div className="mb-8 p-4 bg-surface-container-low rounded-xl border border-outline-variant/50">
            <h3 className="text-sm font-bold text-on-surface mb-3">Crear nueva etiqueta</h3>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Nombre de la etiqueta..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 text-sm outline-none text-on-surface placeholder:text-on-surface-variant"
              />
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(PALETA_COLORES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setColor(key)}
                    style={{ backgroundColor: val.preview }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${color === key ? 'border-on-surface scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'}`}
                    title={key}
                  />
                ))}
              </div>
              <button 
                onClick={handleCreate}
                disabled={isSubmitting || !nombre.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                <Plus size={18} />
                Añadir Etiqueta
              </button>
            </div>
          </div>

          {/* Lista de Etiquetas */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-on-surface mb-2">Etiquetas actuales</h3>
            {etiquetas.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">No hay etiquetas creadas.</p>
            ) : (
              etiquetas.map(etq => (
                <div key={etq.id} className="flex items-center justify-between p-3 border border-outline-variant rounded-xl hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${PALETA_COLORES[etq.color]?.bg || 'bg-slate-100'} ${PALETA_COLORES[etq.color]?.text || 'text-slate-700'} ${PALETA_COLORES[etq.color]?.border || 'border-slate-200'}`}>
                      {etq.nombre}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">
                      ({etq.cantidad_clientes} {etq.cantidad_clientes === 1 ? 'cliente' : 'clientes'})
                    </span>
                  </div>
                  <button 
                    onClick={() => setEtiquetaToDelete(etq)}
                    className="p-2 text-error/70 hover:text-error hover:bg-error-container rounded-lg transition-colors"
                    title="Eliminar etiqueta"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación de Borrado */}
      {etiquetaToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface w-[95vw] max-w-[400px] min-w-[320px] rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-error">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Eliminar Etiqueta</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              ¿Estás seguro de que deseas eliminar la etiqueta <strong>{etiquetaToDelete.nombre}</strong>?
            </p>
            {etiquetaToDelete.cantidad_clientes > 0 && (
              <div className="bg-error-container/30 border border-error/20 p-3 rounded-lg mt-2 text-sm text-error font-medium">
                Esta etiqueta está asignada a {etiquetaToDelete.cantidad_clientes} {etiquetaToDelete.cantidad_clientes === 1 ? 'cliente' : 'clientes'}. Si la eliminas, pasarán a estar "Sin etiqueta".
              </div>
            )}
            <div className="flex items-center justify-end gap-3 mt-4">
              <button 
                onClick={() => setEtiquetaToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-error text-on-error hover:brightness-110 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
