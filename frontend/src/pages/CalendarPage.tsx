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
      await fetchData();
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
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:shadow"
        >
          <Bell size={16} className={peticiones.filter(p => p.estado === 'pendiente_admin').length > 0 ? "text-blue-600" : ""} />
          <span>Peticiones</span>
          {peticiones.filter(p => p.estado === 'pendiente_admin').length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center font-bold border-2 border-white shadow-sm">
              {peticiones.filter(p => p.estado === 'pendiente_admin').length}
            </span>
          )}
        </button>
        
        {/* Botón Actualizar */}
        <button 
          onClick={handleManualRefresh}
          disabled={cooldown > 0 || isRefreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
            ${cooldown > 0 || isRefreshing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
              : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:shadow'}`}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          {cooldown > 0 ? `Espera ${cooldown}s` : 'Actualizar Calendario'}
        </button>
      </div>

      <div className="flex-1 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-0 relative">
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
          <div className="relative w-[800px] max-w-[90vw] shrink-0 bg-white h-full shadow-2xl flex flex-col z-10 border-l border-gray-200">
            {/* Header del Drawer */}
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 leading-tight">Peticiones de Citas</h2>
                  <p className="text-xs text-gray-500 font-medium">Gestiona solicitudes de IA</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Pestañas de Navegación */}
            <div className="flex border-b border-gray-200 bg-white shadow-sm shrink-0">
              <button 
                onClick={() => setActiveTab('recibidas')}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 outline-none
                  ${activeTab === 'recibidas' 
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <Clock size={16} className={activeTab === 'recibidas' ? 'text-blue-600' : 'text-gray-400'} /> 
                Recibidas (IA)
                {peticiones.filter(p => p.estado === 'pendiente_admin').length > 0 && (
                  <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'recibidas' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {peticiones.filter(p => p.estado === 'pendiente_admin').length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('esperando')}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 flex items-center justify-center gap-2 outline-none
                  ${activeTab === 'esperando' 
                    ? 'border-orange-500 text-orange-700 bg-orange-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                <Check size={16} className={activeTab === 'esperando' ? 'text-orange-500' : 'text-gray-400'} /> 
                Esperando Confirmación
                {peticiones.filter(p => p.estado === 'pendiente_cliente').length > 0 && (
                  <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'esperando' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {peticiones.filter(p => p.estado === 'pendiente_cliente').length}
                  </span>
                )}
              </button>
            </div>

            {/* Cuerpo del Drawer (Listas) */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-8 bg-gray-50/30">
              
              {/* Sección: Pendientes por Admin */}
              {activeTab === 'recibidas' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Clock size={14} className="text-blue-500" /> Peticiones Recibidas (IA)
                </h3>
                <div className="flex flex-col gap-3">
                  {peticiones.filter(p => p.estado === 'pendiente_admin').length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      No hay peticiones nuevas
                    </div>
                  ) : (
                    peticiones.filter(p => p.estado === 'pendiente_admin').map(p => (
                      <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm">{p.cliente_nombre}</span>
                            <span className="text-xs text-gray-500">{p.cliente_telefono}</span>
                          </div>
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wide">
                            Nueva
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 text-[13px] text-gray-700 flex flex-col gap-1.5 mb-4 border border-gray-100">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Vehículo:</span>
                            <span className="font-semibold">{p.vehiculo_modelo || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Horario:</span>
                            <span className="font-semibold text-blue-700">
                              {new Date(p.fecha_propuesta).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}hs
                            </span>
                          </div>
                        </div>
                        
                        {posponerId === p.id ? (
                          <div className="flex flex-col gap-2 bg-gray-100 p-2.5 rounded-lg border border-gray-200">
                            <label className="text-xs font-semibold text-gray-700">Nueva Fecha Propuesta:</label>
                            <input 
                              type="datetime-local" 
                              value={nuevaFecha}
                              onChange={(e) => setNuevaFecha(e.target.value)}
                              className="text-xs p-1.5 border border-gray-300 rounded bg-white shadow-sm outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2 mt-1">
                              <button 
                                onClick={() => handlePosponer(p.id)}
                                disabled={isActionLoading || !nuevaFecha}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold py-1.5 rounded disabled:opacity-50 transition-colors shadow-sm"
                              >
                                Confirmar
                              </button>
                              <button 
                                onClick={() => { setPosponerId(null); setNuevaFecha(''); }}
                                disabled={isActionLoading}
                                className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-[11px] font-semibold py-1.5 rounded disabled:opacity-50 transition-colors"
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
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                              Aceptar
                            </button>
                            <button 
                              onClick={() => { setPosponerId(p.id); setNuevaFecha(''); }}
                              disabled={isActionLoading}
                              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
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
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                   <Check size={14} className="text-orange-500" /> Esperando Confirmación
                </h3>
                <div className="flex flex-col gap-3">
                  {peticiones.filter(p => p.estado === 'pendiente_cliente').length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      No hay peticiones esperando al cliente
                    </div>
                  ) : (
                    peticiones.filter(p => p.estado === 'pendiente_cliente').map(p => (
                      <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm relative overflow-hidden opacity-90">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 text-sm">{p.cliente_nombre}</span>
                            <span className="text-xs text-gray-500">{p.cliente_telefono}</span>
                          </div>
                          <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100 uppercase tracking-wide flex items-center gap-1">
                            WhatsApp <Check size={10} />
                          </span>
                        </div>
                        <div className="bg-orange-50/50 rounded-lg p-3 text-[13px] text-gray-700 flex flex-col gap-1.5 mb-4 border border-orange-100/50">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Vehículo:</span>
                            <span className="font-semibold">{p.vehiculo_modelo || 'N/A'}</span>
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
                            onClick={() => handleForzarConfirmacion(p.id)}
                            disabled={isActionLoading}
                            className="flex-1 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
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
