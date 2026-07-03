import { useState } from 'react'
import { Calendar, Car, Users, ClipboardList, Megaphone, UserCircle2 } from 'lucide-react'
import CalendarView from './components/CalendarView'
import VehiculosView from './components/VehiculosView'
import VentasView from './components/VentasView'
import ClientesView from './components/ClientesView'
import TrabajadoresView from './components/TrabajadoresView'
import PromocionesView from './components/PromocionesView'

function App() {
  const [activeTab, setActiveTab] = useState('calendario')

  const renderTab = () => {
    switch (activeTab) {
      case 'calendario':
        return <CalendarView />
      case 'vehiculos':
        return <VehiculosView />
      case 'ventas':
        return <VentasView />
      case 'clientes':
        return <ClientesView />
      case 'promociones':
        return <PromocionesView />
      case 'trabajadores':
        return <TrabajadoresView />
      default:
        return null
    }
  }

  const tabs = [
    { id: 'calendario', icon: Calendar, label: 'Calendario' },
    { id: 'vehiculos', icon: Car, label: 'Vehículos' },
    { id: 'ventas', icon: ClipboardList, label: 'Ventas' },
    { id: 'clientes', icon: Users, label: 'Clientes' },
    { id: 'promociones', icon: Megaphone, label: 'Promociones' },
    { id: 'trabajadores', icon: UserCircle2, label: 'Trabajadores' },
  ]

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col md:flex-row">
      {/* Desktop Navigation Drawer */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-[60] flex-col p-4 w-72 bg-surface border-r border-outline-variant">
        <div className="mb-8 px-4 flex items-center gap-3">
          <Car className="text-primary" size={28} />
          <h1 className="text-2xl font-bold text-primary">AutoGestor</h1>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ease-in-out ${
                  isActive 
                    ? 'bg-secondary-container text-on-secondary-container font-bold' 
                    : 'text-on-surface-variant hover:bg-surface-container-high font-medium'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </nav>
        
        {/* User Profile Snippet */}
        <div className="mt-auto p-4 bg-surface-container-low rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold">
            JD
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold text-on-surface">Juan Delgado</span>
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Administrador</span>
          </div>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden flex justify-between items-center px-4 h-16 w-full sticky top-0 z-50 bg-surface border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <Car className="text-primary" size={24} />
          <span className="text-xl font-bold text-primary">AutoGestor</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">
            JD
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (optional but keeping mobile simple for now by showing standard content) */}
      <div className="md:hidden flex overflow-x-auto bg-surface border-b border-outline-variant sticky top-16 z-40 hide-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
             <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm transition-colors border-b-2 ${isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant'}`}
             >
               {tab.label}
             </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-screen pb-24 md:pb-8">
        <div className="max-w-[1440px] mx-auto">
          {renderTab()}
        </div>
      </main>
    </div>
  )
}

export default App
