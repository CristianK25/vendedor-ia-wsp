import { useState, useEffect } from 'react'
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
  
  if (view.type === 'dayGridMonth') {
    return (
      <div className="flex items-center gap-1.5 overflow-hidden text-[11px] w-full px-1 cursor-pointer hover:bg-gray-100/50 rounded transition-colors">
        <span className="font-bold shrink-0">{type}</span>
        <span className="opacity-75 shrink-0">{time}</span>
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  // Para vistas semanales y diarias
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs p-1 cursor-pointer">
      <div className="font-bold text-[10px] uppercase tracking-wider opacity-90 mb-0.5">{type} • {time}</div>
      <div className="font-semibold leading-tight">{event.title}</div>
    </div>
  );
}

export default function CalendarView() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<Cita | null>(null);

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const data = await citasApi.getAll();
        setCitas(data);
      } catch (error) {
        console.error("Error fetching citas:", error);
      }
    };

    // Carga inicial
    fetchCitas();

    // Polling cada 10 segundos
    const intervalId = setInterval(fetchCitas, 10000);
    
    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(intervalId);
  }, []);

  const handleDateClick = () => {
    // Aquí puedes abrir un modal para crear una cita en la fecha seleccionada en el futuro
  }

  const handleEventClick = (arg: any) => {
    const citaData = arg.event.extendedProps.citaData;
    if (citaData) {
      setSelectedCita(citaData);
      setIsModalOpen(true);
    }
  }

  const calendarEvents = citas.map(cita => ({
    id: cita.id.toString(),
    title: cita.cliente_nombre || cita.cliente_telefono,
    date: cita.fecha,
    extendedProps: { 
      type: 'Reunión', 
      citaData: cita 
    }
  }));

  return (
    <section className="px-4 md:px-10 pt-4 pb-4 flex-1 flex flex-col h-full min-h-0">
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
      />
    </section>
  )
}
