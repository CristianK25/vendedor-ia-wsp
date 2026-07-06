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
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* Top App Bar / Navigation */}
      <header className="sticky top-0 z-50 bg-surface border-b border-outline-variant w-full shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-8 h-16 w-full max-w-[1600px] mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 shrink-0">
            <Car className="text-primary" size={24} />
            <span className="text-xl font-bold text-primary">AutoGestor</span>
          </div>
          
          {/* Desktop Tabs */}
          <nav className="hidden md:flex items-center justify-center flex-1 mx-8 gap-1 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap ${
                    isActive 
                      ? 'bg-secondary-container text-on-secondary-container font-bold' 
                      : 'text-on-surface-variant hover:bg-surface-container-high font-medium'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User Profile Snippet */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-on-surface">Juan Delgado</span>
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Administrador</span>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs md:text-sm">
              JD
            </div>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex overflow-x-auto bg-surface border-t border-outline-variant hide-scrollbar">
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
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-6 flex flex-col">
        <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
          {renderTab()}
        </div>
      </main>
    </div>
  )
}

export default App
