import React from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export default function CalendarView() {
  const handleDateClick = (arg: any) => {
    alert("Date clicked: " + arg.dateStr)
  }

  return (
    <section className="px-4 md:px-10 py-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-on-surface">Calendario de Citas</h2>
          <p className="text-base text-on-surface-variant mt-1">Administra las citas programadas con los clientes.</p>
        </div>
      </div>
      <div className="flex-1 bg-white p-6 rounded-2xl border border-outline-variant shadow-sm overflow-hidden min-h-[600px]">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          height="100%"
          locale="es"
          dateClick={handleDateClick}
          events={[
            { title: 'Cita: Juan Perez', date: new Date().toISOString().split('T')[0] + 'T10:00:00' },
            { title: 'Cita: Maria Lopez', date: new Date().toISOString().split('T')[0] + 'T14:30:00' }
          ]}
        />
      </div>
    </section>
  )
}
