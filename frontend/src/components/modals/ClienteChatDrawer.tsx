import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Bot, User, Car, RefreshCw } from 'lucide-react';
import { clientesApi } from '../../api/clientes';

const WhatsAppIcon = ({ size = 20, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | string;
  content: string;
  camino?: string | null;
  created_at: string;
}

interface InteraccionResumen {
  id: number;
  tipo: string;
  vehiculo_id?: number | null;
  vehiculo_nombre?: string | null;
  vehiculo_modelo_tasacion?: string | null;
  precio_pretendido?: number | null;
  detalles_tasacion?: string | null;
  fecha: string;
}

interface ClienteChatDrawerProps {
  cliente: any | null;
  isOpen: boolean;
  onClose: () => void;
  onClienteUpdated: (clienteActualizado: any) => void;
}

const CAMINO_LABELS: Record<string, { label: string; color: string }> = {
  catalogo: { label: 'Catálogo', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  agendar_cita: { label: 'Agendar Cita', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  peticion: { label: 'Agendar Cita', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  tasacion: { label: 'Tasación Usado', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  financiacion: { label: 'Financiación', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
  negociacion: { label: 'Negociación', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  humano: { label: 'Derivado a Maxi', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  en_espera_humano: { label: 'Esperando a Maxi', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  general: { label: 'Consulta General', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  fallback: { label: 'General', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

export const ClienteChatDrawer: React.FC<ClienteChatDrawerProps> = ({
  cliente,
  isOpen,
  onClose,
  onClienteUpdated,
}) => {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [interacciones, setInteracciones] = useState<InteraccionResumen[]>([]);
  const [clienteData, setClienteData] = useState<any | null>(cliente);
  const [loading, setLoading] = useState(false);
  const [markingAtendido, setMarkingAtendido] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setClienteData(cliente);
  }, [cliente]);

  const fetchHistorial = async (silent = false) => {
    if (!cliente?.telefono) return;
    if (!silent) setLoading(true);
    try {
      const data: any = await clientesApi.getMensajes(cliente.telefono);
      setMensajes(data.mensajes || []);
      setInteracciones(data.interacciones || []);
      if (data.cliente) {
        setClienteData((prev: any) => ({ ...prev, ...data.cliente }));
      }
    } catch (err) {
      console.error('Error cargando historial de chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !cliente?.telefono) return;
    fetchHistorial(false);

    const interval = setInterval(() => {
      fetchHistorial(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [isOpen, cliente?.telefono]);

  useEffect(() => {
    if (isOpen && mensajes.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes.length, isOpen]);

  if (!isOpen || !clienteData) return null;

  const requiereHumano = clienteData.estado_conversacion === 'REQUIERE_HUMANO';
  const initials = clienteData.nombre ? clienteData.nombre.substring(0, 2).toUpperCase() : 'NN';
  const telefonoWsp = String(clienteData.telefono || '').replace('+', '').trim();

  const handleMarcarAtendido = async () => {
    if (!clienteData?.telefono) return;
    setMarkingAtendido(true);
    try {
      const updated = await clientesApi.marcarAtendido(clienteData.telefono);
      const merged = { ...clienteData, ...updated, estado_conversacion: 'NORMAL' };
      setClienteData(merged);
      onClienteUpdated(merged);
    } catch (err) {
      console.error('Error al marcar como atendido:', err);
      alert('No se pudo actualizar el estado del cliente.');
    } finally {
      setMarkingAtendido(false);
    }
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tasaciones = interacciones.filter((i) => i.tipo === 'venta_tasacion' && (i.vehiculo_modelo_tasacion || i.detalles_tasacion));
  const interesesCompra = interacciones.filter((i) => i.tipo === 'compra' && i.vehiculo_nombre);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        style={{ width: '680px', maxWidth: '92vw' }}
        className="relative w-[800px] max-w-[90vw] shrink-0 bg-surface border-l border-outline-variant h-full shadow-2xl flex flex-col z-10"
      >
        {/* Header: Solo botón Recargar y Cerrar */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 ${
                requiereHumano
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-primary-container text-on-primary-container'
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-on-surface truncate">
                  {clienteData.nombre || 'Cliente WhatsApp'}
                </h3>
                {requiereHumano ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                    <AlertTriangle size={12} />
                    Requiere Atención
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Bot size={12} />
                    Bot Activo
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Tel: +{telefonoWsp}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => fetchHistorial(false)}
              className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Actualizar mensajes"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Alerta de pausa cuando está en REQUIERE_HUMANO */}
        {requiereHumano && (
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-amber-300">
              <AlertTriangle size={16} className="shrink-0 text-amber-400" />
              <span>
                <strong>El bot está pausado para este cliente.</strong> Escribile por WhatsApp y luego marcalo como atendido para reactivar el asistente.
              </span>
            </div>
          </div>
        )}

        {/* Resumen comercial detectado (Tasaciones / Autos consultados) */}
        {(tasaciones.length > 0 || interesesCompra.length > 0) && (
          <div className="px-4 py-3 bg-surface-container-lowest border-b border-outline-variant flex flex-col gap-2 text-xs">
            {interesesCompra.length > 0 && (
              <div className="flex items-center gap-2 text-on-surface-variant flex-wrap">
                <Car size={14} className="text-primary shrink-0" />
                <span className="font-semibold text-on-surface">Autos consultados:</span>
                {Array.from(new Set(interesesCompra.map((i) => i.vehiculo_nombre))).map((nombre, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-semibold border border-primary/20"
                  >
                    {nombre}
                  </span>
                ))}
              </div>
            )}
            {tasaciones.map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25 text-on-surface flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 uppercase tracking-wider text-[10px]">
                    Usado ofrecido en parte de pago
                  </span>
                  {t.precio_pretendido && (
                    <span className="font-bold text-emerald-400">
                      Pide: ${Number(t.precio_pretendido).toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm">{t.vehiculo_modelo_tasacion || 'Vehículo usado'}</div>
                {t.detalles_tasacion && (
                  <div className="text-on-surface-variant text-xs">{t.detalles_tasacion}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Historial de Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-lowest">
          {loading && mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-on-surface-variant gap-2">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
              <span className="text-sm">Cargando conversación...</span>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6 text-on-surface-variant">
              <Bot size={36} className="mb-2 opacity-40" />
              <p className="text-sm font-medium text-on-surface">Aún no hay mensajes registrados con el asistente IA</p>
              <p className="text-xs mt-1">
                Cuando el cliente escriba por WhatsApp, verás toda la conversación acá en tiempo real.
              </p>
            </div>
          ) : (
            mensajes.map((msg) => {
              const isUser = msg.role === 'user';
              const caminoInfo = msg.camino ? CAMINO_LABELS[msg.camino] : null;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                >
                  <div
                    style={{ maxWidth: '85%' }}
                    className={`rounded-2xl px-4 py-2.5 shadow-sm border ${
                      isUser
                        ? 'bg-surface-container-high text-on-surface border-outline-variant rounded-tl-sm'
                        : 'bg-primary/15 text-on-surface border-primary/30 rounded-tr-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[11px] font-bold flex items-center gap-1 opacity-75">
                        {isUser ? (
                          <>
                            <User size={11} /> {clienteData.nombre || 'Cliente'}
                          </>
                        ) : (
                          <>
                            <Bot size={11} className="text-primary" /> Asistente IA
                          </>
                        )}
                      </span>

                      {caminoInfo && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${caminoInfo.color}`}
                        >
                          {caminoInfo.label}
                        </span>
                      )}
                    </div>

                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                    <div className="text-[10px] text-on-surface-variant text-right mt-1.5 opacity-75">
                      {formatDateTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer de Acciones Rápidas: mismo enlace wa.me que el botón WhatsApp de la fila */}
        <div className="p-4 border-t border-outline-variant bg-surface flex flex-col sm:flex-row items-center gap-3">
          <a
            href={`https://wa.me/${telefonoWsp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm"
            title="Abrir WhatsApp Web o App móvil con este número"
          >
            <WhatsAppIcon size={20} />
            Abrir Chat en WhatsApp (+{telefonoWsp})
          </a>

          {requiereHumano && (
            <button
              onClick={handleMarcarAtendido}
              disabled={markingAtendido}
              className="w-full sm:w-auto bg-primary text-on-primary hover:brightness-110 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all text-sm disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 size={18} />
              {markingAtendido ? 'Guardando...' : 'Marcar como Atendido'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
