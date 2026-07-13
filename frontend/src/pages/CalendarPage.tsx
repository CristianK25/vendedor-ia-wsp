import { useState, useEffect, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { citasApi } from '../api/citas'
import type { Cita } from '../types/models'
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(() => {
    const last = sessionStorage.getItem('calendar_last_refresh');
    if (!last) return 0;
    const passedSeconds = Math.floor((Date.now() - parseInt(last)) / 1000);
    return passedSeconds < 20 ? 20 - passedSeconds : 0;
  });

  const fetchCitas = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const data = await citasApi.getAll();
      setCitas(data);
    } catch (error) {
      console.error("Error fetching citas:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial (solo si no estamos en cooldown)
    if (cooldown === 0 && citas.length === 0) {
        fetchCitas();
    } else if (citas.length === 0) {
        // Si hay cooldown pero no hay citas (re-entrada rápida), hacer fetch silencioso sin afectar cooldown
        fetchCitas();
    }
  }, [fetchCitas]); // Se removió cooldown como dependencia para no re-fetchear

  // Manejo del temporizador de 20 segundos
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleManualRefresh = () => {
    if (cooldown === 0 && !isRefreshing) {
      fetchCitas();
      setCooldown(20);
      sessionStorage.setItem('calendar_last_refresh', Date.now().toString());
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
      <div className="flex justify-end mb-3">
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
    </section>
  )
}
