import { Calendar, Car, Users, ClipboardList, Megaphone, UserCircle2 } from 'lucide-react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import CalendarPage from './pages/CalendarPage'
import VehiculosPage from './pages/VehiculosPage'
import VentasPage from './pages/VentasPage'
import ClientesPage from './pages/ClientesPage'
import TrabajadoresPage from './pages/TrabajadoresPage'
import PromocionesPage from './pages/PromocionesPage'

import VehiculoForm from './components/forms/VehiculoForm'
import VentaForm from './components/forms/VentaForm'
import ClienteForm from './components/forms/ClienteForm'
import PromocionForm from './components/forms/PromocionForm'
import TrabajadorForm from './components/forms/TrabajadorForm'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { path: '/calendario', icon: Calendar, label: 'Calendario' },
    { path: '/vehiculos', icon: Car, label: 'Vehículos' },
    { path: '/ventas', icon: ClipboardList, label: 'Ventas' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/promociones', icon: Megaphone, label: 'Promociones' },
    { path: '/trabajadores', icon: UserCircle2, label: 'Trabajadores' },
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
              const isActive = location.pathname.startsWith(tab.path)
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap font-medium ${isActive
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
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
            const isActive = location.pathname.startsWith(tab.path)
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-shrink-0 px-4 py-3 text-sm transition-colors border-b-2 font-medium ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
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
          <Routes>
            <Route path="/calendario" element={<CalendarPage />} />

            <Route path="/vehiculos" element={<VehiculosPage />} />
            <Route path="/vehiculos/nuevo" element={<VehiculoForm />} />

            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/ventas/nuevo" element={<VentaForm />} />

            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/clientes/nuevo" element={<ClienteForm />} />

            <Route path="/promociones" element={<PromocionesPage />} />
            <Route path="/promociones/nuevo" element={<PromocionForm />} />

            <Route path="/trabajadores" element={<TrabajadoresPage />} />
            <Route path="/trabajadores/nuevo" element={<TrabajadorForm />} />

            <Route path="*" element={<Navigate to="/calendario" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
