import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Bell, X, Clock, Check } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { citasApi } from '../api/citas'
import { peticionesApi } from '../api/peticiones'
import type { Cita, Peticion } from '../types/models'
import CitaModal from '../components/CitaModal'

function renderEventContent(eventInfo: any) {
  const { event, view } = eventInfo;
  const type = event.extendedProps.type || 'Cita';
  const time = event.start ? event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + 'hs' : '';
  const estado = event.extendedProps.citaData?.estado || 'pendiente';
  
  let dotColor = 'bg-yellow-500';
  if (estado === 'confirmada') dotColor = 'bg-green-500';
  if (estado === 'cancelada') dotColor = 'bg-gray-400';
  
  if (view.type === 'dayGridMonth') {
    return (
      <div className="flex items-center gap-1.5 overflow-hidden text-[11px] w-full px-1 py-0.5 cursor-pointer rounded transition-colors">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="font-bold shrink-0">{type}</span>
        <span className="opacity-75 shrink-0">{time}</span>
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  // Para vistas semanales y diarias
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs p-1 cursor-pointer">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
        <div className="font-bold text-[10px] uppercase tracking-wider opacity-90">{type} • {time}</div>
      </div>
      <div className="font-semibold leading-tight">{event.title}</div>
    </div>
  );
}

const getVehiculoLabel = (modelo?: string | null) => {
  if (!modelo || ['null', 'n/a', 'none', ''].includes(modelo.trim().toLowerCase())) {
    return 'Consulta general';
  }
  return modelo;
};

export default function CalendarView() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  
  // Estado para el panel de peticiones
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [posponerId, setPosponerId] = useState<number | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState<string>('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recibidas' | 'esperando'>('recibidas');
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(() => {
    const last = sessionStorage.getItem('calendar_last_refresh');
    if (!last) return 0;
    const passedSeconds = Math.floor((Date.now() - parseInt(last)) / 1000);
    return passedSeconds < 20 ? 20 - passedSeconds : 0;
  });

  const fetchData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [citasData, peticionesData] = await Promise.all([
        citasApi.getAll(),
        peticionesApi.getAll()
      ]);
      setCitas(citasData);
      setPeticiones(peticionesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (cooldown === 0 && (citas.length === 0 || peticiones.length === 0)) {
        fetchData();
    } else if (citas.length === 0 || peticiones.length === 0) {
        fetchData();
    }
  }, [fetchData]);

  // Manejo del temporizador de 20 segundos
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleManualRefresh = () => {
    if (cooldown === 0 && !isRefreshing) {
      fetchData();
      setCooldown(20);
      sessionStorage.setItem('calendar_last_refresh', Date.now().toString());
    }
  };

  const handleAceptar = async (id: number) => {
    try {
      setIsActionLoading(true);
      await peticionesApi.aceptar(id);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePosponer = async (id: number) => {
    if (!nuevaFecha) return;
    try {
      setIsActionLoading(true);
      await peticionesApi.posponer(id, nuevaFecha);
      setPosponerId(null);
      setNuevaFecha('');
      setActiveTab('esperando');
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReenviarWhatsApp = async (id: number) => {
    try {
      setIsActionLoading(true);
      await peticionesApi.reenviarWhatsApp(id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleForzarConfirmacion = async (id: number) => {
    try {
      setIsActionLoading(true);
      await peticionesApi.forzarConfirmacion(id);
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDateClick = () => {
    // Aquí puedes abrir un modal para crear una cita en la fecha seleccionada en el futuro
  }

  const handleCitaUpdate = (updatedCita: Cita) => {
    setCitas(prev => prev.map(c => c.id === updatedCita.id ? updatedCita : c));
  };

  const handleEventClick = (arg: any) => {
    const citaData = arg.event.extendedProps.citaData;
    if (citaData) {
      setSelectedCita(citaData);
      setIsModalOpen(true);
    }
  }

  const getEventColors = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return {
          backgroundColor: '#dcfce7',
          borderColor: '#22c55e',
          textColor: '#14532d'
        };
      case 'cancelada':
        return {
          backgroundColor: '#f3f4f6',
          borderColor: '#d1d5db',
          textColor: '#6b7280'
        };
      case 'pendiente':
      default:
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#78350f'
        };
    }
  };

  const calendarEvents = citas.map(cita => {
    const colors = getEventColors(cita.estado);
    return {
      id: cita.id.toString(),
      title: cita.cliente_nombre || cita.cliente_telefono,
      date: cita.fecha,
      ...colors,
      extendedProps: { 
        type: 'Reunión', 
        citaData: cita 
      }
    };
  });

  return (
    <section className="px-4 md:px-10 pt-4 pb-4 flex-1 flex flex-col h-full min-h-0">
      <div className="flex justify-end items-center gap-3 mb-3">
        {/* Botón de Peticiones */}
        <button 
          onClick={() => setIsDrawerOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-md bg-surface text-on-surface border border-outline-variant hover:bg-surface-container-high cursor-pointer"
        >
          <Bell size={16} className={peticiones.filter(p => p.estado === 'pendiente_admin').length > 0 ? "text-primary" : "text-on-surface-variant"} />
          <span>Peticiones</span>
          {peticiones.filter(p => p.estado === 'pendiente_admin').length > 0 && (
            <span className="absolute -top-2 -right-2 bg-error text-on-error rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-extrabold border-2 border-background shadow-sm">
              {peticiones.filter(p => p.estado === 'pendiente_admin').length}
            </span>
          )}
        </button>
        
        {/* Botón Actualizar */}
        <button 
          onClick={handleManualRefresh}
          disabled={cooldown > 0 || isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer
            ${cooldown > 0 || isRefreshing 
              ? 'bg-surface-container-low text-on-surface-variant cursor-not-allowed border border-outline-variant' 
              : 'bg-surface text-primary border border-primary/30 hover:bg-primary/10'}`}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {cooldown > 0 ? `Espera ${cooldown}s` : 'Actualizar Calendario'}
        </button>
      </div>

      <div className="flex-1 bg-surface p-6 rounded-2xl border border-outline-variant shadow-xl overflow-hidden flex flex-col min-h-0 relative">
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día'
              }}
              height="100%"
              locale="es"
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              events={calendarEvents}
            />
          </div>
        </div>
      </div>
      
      <CitaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        cita={selectedCita} 
        onUpdate={handleCitaUpdate}
      />

      {/* Drawer de Peticiones */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex justify-end">
          {/* Capa invisible para cerrar al hacer clic fuera */}
          <div 
            className="absolute inset-0 bg-transparent" 
            onClick={() => setIsDrawerOpen(false)} 
          />
          
          {/* Contenedor del Drawer */}
          <div className="relative w-[800px] max-w-[90vw] shrink-0 bg-surface h-full shadow-2xl flex flex-col z-10 border-l border-outline-variant">
            {/* Header del Drawer */}
            <div className="px-5 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-secondary-container p-2 rounded-xl text-secondary">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface leading-tight">Peticiones de Citas</h2>
                  <p className="text-xs text-on-surface-variant font-medium">Gestiona solicitudes de IA</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Pestañas de Navegación */}
            <div className="flex border-b border-outline-variant bg-surface shrink-0">
              <button 
                onClick={() => setActiveTab('recibidas')}
                className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 outline-none cursor-pointer
                  ${activeTab === 'recibidas' 
                    ? 'border-primary text-primary bg-secondary-container' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
              >
                <Clock size={16} className={activeTab === 'recibidas' ? 'text-primary' : 'text-on-surface-variant'} /> 
                Recibidas (IA)
                {peticiones.filter(p => p.estado === 'pendiente_admin').length > 0 && (
                  <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'recibidas' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {peticiones.filter(p => p.estado === 'pendiente_admin').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('esperando')}
                className={`flex-1 py-3.5 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 outline-none cursor-pointer
                  ${activeTab === 'esperando' 
                    ? 'border-amber-400 text-amber-400 bg-amber-500/10' 
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
              >
                <Check size={16} className={activeTab === 'esperando' ? 'text-amber-400' : 'text-on-surface-variant'} /> 
                Esperando Confirmación
                {peticiones.filter(p => p.estado === 'pendiente_cliente').length > 0 && (
                  <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'esperando' ? 'bg-amber-400 text-slate-950' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {peticiones.filter(p => p.estado === 'pendiente_cliente').length}
                  </span>
                )}
              </button>
            </div>

            {/* Cuerpo del Drawer (Listas) */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8 bg-surface-container-low">
              
              {/* Sección: Pendientes por Admin */}
              {activeTab === 'recibidas' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Clock size={14} className="text-primary" /> Peticiones Recibidas (IA)
                </h3>
                <div className="flex flex-col gap-3">
                  {peticiones.filter(p => p.estado === 'pendiente_admin').length === 0 ? (
                    <div className="text-center py-6 text-sm text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl">
                      No hay peticiones nuevas
                    </div>
                  ) : (
                    peticiones.filter(p => p.estado === 'pendiente_admin').map(p => (
                      <div key={p.id} className="bg-surface border border-outline-variant rounded-xl p-4 shadow-lg hover:border-primary/40 transition-all relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface text-sm">{p.cliente_nombre}</span>
                            <span className="text-xs text-on-surface-variant">{p.cliente_telefono}</span>
                          </div>
                          <span className="text-[10px] font-bold bg-secondary-container text-secondary px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wide">
                            Nueva
                          </span>
                        </div>
                        <div className="bg-surface-container-lowest rounded-lg p-3 text-[13px] text-on-surface flex flex-col gap-1.5 mb-4 border border-outline-variant">
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Vehículo:</span>
                            <span className="font-semibold text-on-surface">{getVehiculoLabel(p.vehiculo_modelo)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-on-surface-variant">Horario:</span>
                            <span className="font-bold text-secondary">
                              {new Date(p.fecha_propuesta).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}hs
                            </span>
                          </div>
                        </div>
                        
                        {posponerId === p.id ? (
                          <div className="flex flex-col gap-2 bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant">
                            <label className="text-xs font-semibold text-on-surface">Nueva Fecha Propuesta:</label>
                            <input 
                              type="datetime-local" 
                              value={nuevaFecha}
                              onChange={(e) => setNuevaFecha(e.target.value)}
                              className="text-xs p-2 border border-outline-variant rounded bg-surface text-on-surface shadow-sm outline-none focus:border-primary"
                            />
                            <div className="flex gap-2 mt-1">
                              <button 
                                onClick={() => handlePosponer(p.id)}
                                disabled={isActionLoading || !nuevaFecha}
                                className="flex-1 bg-primary hover:bg-primary-container text-on-primary text-[11px] font-extrabold py-1.5 rounded disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button 
                                onClick={() => { setPosponerId(null); setNuevaFecha(''); }}
                                disabled={isActionLoading}
                                className="flex-1 bg-surface border border-outline-variant hover:bg-surface-container-high text-on-surface text-[11px] font-semibold py-1.5 rounded disabled:opacity-50 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleAceptar(p.id)}
                              disabled={isActionLoading}
                              className="flex-1 bg-primary hover:bg-primary-container text-on-primary text-xs font-extrabold py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              Aceptar
                            </button>
                            <button 
                              onClick={() => { setPosponerId(p.id); setNuevaFecha(''); }}
                              disabled={isActionLoading}
                              className="flex-1 bg-surface border border-outline-variant hover:bg-surface-container-high text-on-surface text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Posponer
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}

              {/* Sección: Pendientes por Cliente */}
              {activeTab === 'esperando' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Check size={14} className="text-amber-400" /> Esperando Confirmación
                </h3>
                <div className="flex flex-col gap-3">
                  {peticiones.filter(p => p.estado === 'pendiente_cliente').length === 0 ? (
                    <div className="text-center py-6 text-sm text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl">
                      No hay peticiones esperando al cliente
                    </div>
                  ) : (
                    peticiones.filter(p => p.estado === 'pendiente_cliente').map(p => (
                      <div key={p.id} className="bg-surface border border-outline-variant rounded-xl p-4 shadow-lg relative overflow-hidden opacity-90">
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface text-sm">{p.cliente_nombre}</span>
                            <span className="text-xs text-on-surface-variant">{p.cliente_telefono}</span>
                          </div>
                          <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-wide flex items-center gap-1">
                            WhatsApp <Check size={10} />
                          </span>
                        </div>
                        <div className="bg-orange-50/50 rounded-lg p-3 text-[13px] text-gray-700 flex flex-col gap-1.5 mb-4 border border-orange-100/50">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Vehículo:</span>
                            <span className="font-semibold">{getVehiculoLabel(p.vehiculo_modelo)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Propuesta:</span>
                            <span className="font-semibold text-orange-700">
                              {new Date(p.fecha_propuesta).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}hs
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReenviarWhatsApp(p.id)}
                            disabled={isActionLoading}
                            className="flex-1 bg-[#25D366]/15 text-[#128C7E] dark:text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 text-xs font-bold py-2 rounded-lg transition-colors text-center flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            Reenviar WhatsApp
                          </button>
                          <button 
                            onClick={() => handleForzarConfirmacion(p.id)}
                            disabled={isActionLoading}
                            className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Forzar Confirmación
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
