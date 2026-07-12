import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, Search, UserPlus, Car } from 'lucide-react';
import { vehiculosApi } from '../../api/vehiculos';
import { clientesApi } from '../../api/clientes';
import { ventasApi } from '../../api/ventas';

export default function VentaForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Vehículo
  const [vehiculoSearch, setVehiculoSearch] = useState('');
  const [vehiculosResults, setVehiculosResults] = useState<any[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<any>(null);

  // Cliente
  const [clienteSearch, setClienteSearch] = useState('');
  const [clientesResults, setClientesResults] = useState<any[]>([]);
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ telefono: '', nombre: '' });

  // Sale Details
  const [precioFinal, setPrecioFinal] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');

  // Buscador Vehículos
  useEffect(() => {
    if (vehiculoSearch.length > 2 && !selectedVehiculo) {
      vehiculosApi.getAll({ page: 1, size: 10, search: vehiculoSearch }).then((data: any) => {
        // Filtrar solo disponibles
        setVehiculosResults(data.items.filter((v: any) => v.estado === 'disponible'));
      });
    } else {
      setVehiculosResults([]);
    }
  }, [vehiculoSearch, selectedVehiculo]);

  // Buscador Clientes
  useEffect(() => {
    if (clienteSearch.length > 2 && !isNewClient && !clienteTelefono) {
      clientesApi.getAll(1, 10, clienteSearch).then((data: any) => {
        setClientesResults(data.items);
      });
    } else {
      setClientesResults([]);
    }
  }, [clienteSearch, isNewClient, clienteTelefono]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedVehiculo) {
        alert('Por favor seleccione un vehículo.');
        setLoading(false);
        return;
      }

      let finalTelefono = clienteTelefono;

      if (isNewClient) {
        if (!newClientData.telefono || !newClientData.nombre) {
          alert('Por favor complete los datos del cliente.');
          setLoading(false);
          return;
        }
        await clientesApi.create(newClientData);
        finalTelefono = newClientData.telefono;
      }

      if (!finalTelefono) {
        alert('Por favor seleccione o cree un cliente.');
        setLoading(false);
        return;
      }

      const ventaData = {
        vehiculo_id: selectedVehiculo.id,
        cliente_telefono: finalTelefono,
        precio_final: parseFloat(precioFinal),
        metodo_pago: metodoPago,
        notas: notas
      };

      await ventasApi.create(ventaData);
      navigate('/ventas');
    } catch (error) {
      console.error(error);
      alert('Error al registrar la venta. Verifique los datos e intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/ventas')}
            className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Registrar Nueva Venta</h1>
            <p className="text-on-surface-variant text-sm mt-1">Completa los datos de la venta y el cliente.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Sección Vehículo */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Car size={20} className="text-primary" /> Vehículo Vendido
          </h2>
          
          {selectedVehiculo ? (
            <div className="flex items-center justify-between bg-primary-container/30 text-on-surface p-4 rounded-xl border border-primary/20">
              <div>
                <p className="font-bold text-lg">{selectedVehiculo.modelo}</p>
                <p className="text-sm text-on-surface-variant mt-1">Precio lista: ${selectedVehiculo.precio.toLocaleString()} • {selectedVehiculo.kilometraje.toLocaleString()} km</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedVehiculo(null); setPrecioFinal(''); }}
                className="text-sm uppercase font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
              >
                Cambiar Vehículo
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
              <input 
                type="text" 
                placeholder="Buscar vehículo por modelo o marca..." 
                value={vehiculoSearch}
                onChange={e => setVehiculoSearch(e.target.value)}
                className="w-full pl-12 pr-4 h-12 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base" 
              />
              
              {vehiculosResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto overflow-hidden">
                  {vehiculosResults.map(v => (
                    <div 
                      key={v.id}
                      onClick={() => {
                        setSelectedVehiculo(v);
                        setVehiculoSearch('');
                        setPrecioFinal(v.precio.toString());
                      }}
                      className="p-4 hover:bg-surface-container-low cursor-pointer border-b border-outline-variant last:border-0 flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{v.modelo}</p>
                        <p className="text-sm text-on-surface-variant">{v.kilometraje.toLocaleString()} km</p>
                      </div>
                      <span className="font-bold text-primary">${v.precio.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección Cliente */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm opacity-100 transition-opacity">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
              <UserPlus size={20} className="text-primary" /> Datos del Cliente
            </h2>
            <button 
              type="button"
              onClick={() => { setIsNewClient(!isNewClient); setClienteTelefono(''); setClienteNombre(''); setClienteSearch(''); }}
              className="text-primary text-sm font-semibold hover:underline"
            >
              {isNewClient ? 'Buscar Cliente Existente' : 'Registrar Nuevo Cliente'}
            </button>
          </div>

          {isNewClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Nombre Completo *</label>
                <input 
                  type="text" 
                  required
                  value={newClientData.nombre}
                  onChange={e => setNewClientData({...newClientData, nombre: e.target.value})}
                  className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface-variant mb-1">Teléfono (ID) *</label>
                <input 
                  type="text" 
                  required
                  value={newClientData.telefono}
                  onChange={e => setNewClientData({...newClientData, telefono: e.target.value})}
                  className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                />
              </div>
            </div>
          ) : (
            <div>
              {clienteTelefono ? (
                <div className="flex items-center justify-between bg-primary-container/30 text-on-surface p-4 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {clienteNombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{clienteNombre}</p>
                      <p className="text-sm text-on-surface-variant">{clienteTelefono}</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => { setClienteTelefono(''); setClienteNombre(''); }}
                    className="text-sm uppercase font-bold text-primary hover:bg-primary/10 px-3 py-2 rounded-lg transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar cliente por nombre o teléfono..." 
                    value={clienteSearch}
                    onChange={e => setClienteSearch(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base" 
                  />
                  
                  {clientesResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-outline-variant rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                      {clientesResults.map(client => (
                        <div 
                          key={client.telefono}
                          onClick={() => {
                            setClienteTelefono(client.telefono);
                            setClienteNombre(client.nombre || client.telefono);
                            setClienteSearch('');
                          }}
                          className="p-4 hover:bg-surface-container-low cursor-pointer border-b border-outline-variant last:border-0"
                        >
                          <p className="font-semibold text-on-surface">{client.nombre}</p>
                          <p className="text-sm text-on-surface-variant">{client.telefono}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalles Finales de Venta */}
        <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface mb-4">Detalles de la Transacción</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Precio Final ($) *</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={precioFinal}
                onChange={e => setPrecioFinal(e.target.value)}
                disabled={!selectedVehiculo}
                className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-xl disabled:opacity-50" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Método de Pago *</label>
              <select 
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
                <option value="Financiado">Financiado</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Notas / Observaciones (Opcional)</label>
              <textarea 
                rows={3}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="Ej: Se entregó con medio tanque, falta firmar formulario..."
                className="w-full p-4 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 pb-12">
          <button 
            type="submit"
            disabled={loading || !selectedVehiculo || (!isNewClient && !clienteTelefono)}
            className="px-8 py-4 rounded-xl font-bold bg-primary text-on-primary text-lg hover:bg-primary-container hover:text-on-primary-container transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Procesando Venta...' : 'Registrar Venta Oficial'}
          </button>
        </div>

      </form>
    </div>
  );
}
