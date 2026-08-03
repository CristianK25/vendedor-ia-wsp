import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, CheckCircle2 } from 'lucide-react';
import { citasApi } from '../../api/citas';
import { clientesApi } from '../../api/clientes';
import { ventasApi } from '../../api/ventas';

export default function MarcarVendidoModal({ vehiculo, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  
  // State for creating sale
  const [precioFinal, setPrecioFinal] = useState(vehiculo.precio_venta.toString());
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notas, setNotas] = useState('');
  const [esReventa, setEsReventa] = useState(false);
  
  // Client selection
  const [clienteTelefono, setClienteTelefono] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  
  // Search
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // New Client Mode
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ telefono: '', nombre: '' });

  useEffect(() => {
    // Check if there's an appointment today
    citasApi.getHoyByVehiculo(vehiculo.id).then((cita: any) => {
      if (cita && cita.cliente_telefono) {
        setClienteTelefono(cita.cliente_telefono);
        setClienteNombre(cita.cliente_nombre || cita.cliente_telefono);
      }
    });
  }, [vehiculo.id]);

  useEffect(() => {
    if (search.length > 2 && !isNewClient) {
      clientesApi.getAll(1, 10, search).then((data: any) => {
        setSearchResults(data.items);
      });
    } else {
      setSearchResults([]);
    }
  }, [search, isNewClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let finalTelefono = clienteTelefono;
      
      // If new client, create it first
      if (isNewClient) {
        if (!newClientData.telefono || !newClientData.nombre) {
          alert('Por favor complete los datos del cliente');
          setLoading(false);
          return;
        }
        await clientesApi.create(newClientData);
        finalTelefono = newClientData.telefono;
      }

      if (!finalTelefono) {
        alert('Por favor seleccione o cree un cliente');
        setLoading(false);
        return;
      }

      const ventaData = {
        vehiculo_id: vehiculo.id,
        cliente_telefono: finalTelefono,
        precio_final: parseFloat(precioFinal),
        metodo_pago: metodoPago,
        notas: notas,
        estado_vehiculo: esReventa ? 'reventa' : 'vendido'
      };

      await ventasApi.create(ventaData);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Error al procesar la venta');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
      <div 
        className="bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ width: '100%', maxWidth: '512px', maxHeight: '90vh' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Vender Vehículo</h2>
            <p className="text-sm text-on-surface-variant mt-1">{vehiculo.modelo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors text-on-surface-variant">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          
          {/* Client Selection Section */}
          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-on-surface">Datos del Cliente</h3>
              <button 
                type="button"
                onClick={() => setIsNewClient(!isNewClient)}
                className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline"
              >
                {isNewClient ? 'Buscar Existente' : <><UserPlus size={16} /> Nuevo Cliente</>}
              </button>
            </div>

            {isNewClient ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required
                    value={newClientData.nombre}
                    onChange={e => setNewClientData({...newClientData, nombre: e.target.value})}
                    className="w-full h-11 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface-variant mb-1">Teléfono (ID)</label>
                  <input 
                    type="text" 
                    required
                    value={newClientData.telefono}
                    onChange={e => setNewClientData({...newClientData, telefono: e.target.value})}
                    className="w-full h-11 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {clienteTelefono ? (
                  <div className="flex items-center justify-between bg-primary-container text-on-primary-container p-3 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{clienteNombre}</p>
                        <p className="text-xs opacity-80">{clienteTelefono}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setClienteTelefono(''); setClienteNombre(''); }}
                      className="text-xs uppercase font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="text" 
                      placeholder="Buscar cliente por nombre o teléfono..." 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 h-11 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                    />
                    
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                        {searchResults.map(client => (
                          <div 
                            key={client.telefono}
                            onClick={() => {
                              setClienteTelefono(client.telefono);
                              setClienteNombre(client.nombre || client.telefono);
                              setSearch('');
                            }}
                            className="p-3 hover:bg-surface-container-low cursor-pointer border-b border-outline-variant last:border-0"
                          >
                            <p className="font-semibold text-sm text-on-surface">{client.nombre}</p>
                            <p className="text-xs text-on-surface-variant">{client.telefono}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sale Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Precio Final ($)</label>
              <input 
                type="number" 
                step="0.01"
                required
                value={precioFinal}
                onChange={e => setPrecioFinal(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold text-lg" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Método de Pago</label>
              <select 
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
                <option value="Financiado">Financiado</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-1">Notas / Observaciones (Opcional)</label>
            <textarea 
              rows={3}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Se entregó con medio tanque, falta firmar formulario X..."
              className="w-full p-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" 
            />
          </div>

          <div 
            className={`p-4 rounded-xl border-2 transition-colors cursor-pointer flex items-start gap-4 select-none ${esReventa ? 'bg-orange-50 border-orange-500' : 'bg-surface-container-low border-outline-variant hover:border-orange-300'}`} 
            onClick={() => setEsReventa(!esReventa)}
          >
            <div className="pt-0.5">
              <input 
                type="checkbox" 
                checked={esReventa}
                onChange={() => {}} 
                className="w-5 h-5 accent-orange-600 cursor-pointer rounded border-outline-variant"
              />
            </div>
            <div>
              <h4 className={`font-bold ${esReventa ? 'text-orange-900' : 'text-on-surface'}`}>
                Marcar como Venta de Reventa
              </h4>
              <p className={`text-sm mt-1 leading-relaxed ${esReventa ? 'text-orange-800' : 'text-on-surface-variant'}`}>
                Al activar esta opción, el vehículo pasará al estado "Reventa" en lugar del tradicional "Vendido".
              </p>
            </div>
          </div>

        </form>
        
        <div className="p-6 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading || (!isNewClient && !clienteTelefono)}
            className="px-6 py-2.5 rounded-lg font-bold bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? 'Procesando...' : 'Confirmar Venta'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
