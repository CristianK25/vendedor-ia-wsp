import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

function renderEventContent(eventInfo: any) {
  const { event, view } = eventInfo;
  const type = event.extendedProps.type || 'Cita';
  const time = event.start ? event.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) + 'hs' : '';
  
  if (view.type === 'dayGridMonth') {
    return (
      <div className="flex items-center gap-1.5 overflow-hidden text-[11px] w-full px-1">
        <span className="font-bold shrink-0">{type}</span>
        <span className="opacity-75 shrink-0">{time}</span>
        <span className="truncate">{event.title}</span>
      </div>
    );
  }

  // Para vistas semanales y diarias
  return (
    <div className="flex flex-col h-full overflow-hidden text-xs p-1">
      <div className="font-bold text-[10px] uppercase tracking-wider opacity-90 mb-0.5">{type} • {time}</div>
      <div className="font-semibold leading-tight">{event.title}</div>
    </div>
  );
}

export default function CalendarView() {
  const handleDateClick = (arg: any) => {
    alert("Date clicked: " + arg.dateStr)
  }

  return (
    <section className="px-4 md:px-10 pt-4 pb-4 flex-1 flex flex-col h-full min-h-0">
      <div className="flex-1 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-0">
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
              eventContent={renderEventContent}
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }}
              events={[
                { title: 'Juan Perez', extendedProps: { type: 'Cita' }, date: new Date().toISOString().split('T')[0] + 'T10:00:00' },
                { title: 'Maria Lopez', extendedProps: { type: 'Reunión' }, date: new Date().toISOString().split('T')[0] + 'T14:30:00' }
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
