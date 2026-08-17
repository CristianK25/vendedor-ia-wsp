import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, DollarSign, Wrench, Sparkles, Package, Truck, FileText, ClipboardList, Paperclip, Loader2 } from 'lucide-react';
import type { GastoVehiculo, CategoriaGasto } from '../../types/gasto';
import { gastosApi } from '../../api/gastos';

interface GastoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehiculoId: number;
  gasto?: GastoVehiculo | null;
  onSuccess: () => void;
}

const CATEGORIAS: { value: CategoriaGasto; label: string; icon: any }[] = [
  { value: 'mecanica', label: 'Mecánica', icon: Wrench },
  { value: 'detailing_preparacion', label: 'Detailing / Preparación', icon: Sparkles },
  { value: 'repuestos', label: 'Repuestos', icon: Package },
  { value: 'flete', label: 'Flete', icon: Truck },
  { value: 'patentes_tramites', label: 'Patentes / Trámites', icon: FileText },
  { value: 'otros', label: 'Otros / Varios', icon: ClipboardList },
];

export default function GastoFormModal({ isOpen, onClose, vehiculoId, gasto, onSuccess }: GastoFormModalProps) {
  const [fecha, setFecha] = useState<string>('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('mecanica');
  const [monto, setMonto] = useState<string>('');
  const [proveedor, setProveedor] = useState<string>('');
  const [facturaA, setFacturaA] = useState<boolean>(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setArchivo(null);
      if (gasto) {
        setFecha(gasto.fecha);
        setCategoria(gasto.categoria);
        setMonto(gasto.monto.toString());
        setProveedor(gasto.proveedor);
        setFacturaA(gasto.factura_a);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setFecha(today);
        setCategoria('mecanica');
        setMonto('');
        setProveedor('');
        setFacturaA(false);
      }
    }
  }, [isOpen, gasto]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha || !categoria || !monto || !proveedor) {
      setError('Por favor, completa todos los campos requeridos.');
      return;
    }

    const valorMonto = parseFloat(monto);
    if (isNaN(valorMonto) || valorMonto <= 0) {
      setError('El monto debe ser un número positivo.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const data = {
      fecha,
      categoria,
      monto: valorMonto,
      proveedor,
      factura_a: facturaA,
    };

    try {
      if (gasto) {
        await gastosApi.editar(gasto.id, data, archivo || undefined);
      } else {
        await gastosApi.crear(vehiculoId, data, archivo || undefined);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al guardar el gasto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Solo se admiten comprobantes en formato PDF o imagen (JPG, PNG).');
        return;
      }
      
      setArchivo(selectedFile);
      setError(null);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div 
        className="bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-150"
        style={{ width: '100%', maxWidth: '420px', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
          <div>
            <h2 className="text-base font-bold text-on-surface">
              {gasto ? 'Editar Gasto' : 'Cargar Gasto'}
            </h2>
            <p className="text-[11px] text-on-surface-variant">
              Costos de preparación y mantenimiento de la unidad.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-lg transition-colors"
            disabled={submitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {error && (
            <div className="bg-error-container text-on-error-container text-xs p-2.5 rounded-xl border border-error/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Fecha */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <Calendar size={12} /> Fecha *
              </label>
              <input 
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full bg-surface border border-outline rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Categoría *</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value as CategoriaGasto)}
                className="w-full bg-surface border border-outline rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              >
                {CATEGORIAS.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Monto */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <DollarSign size={12} /> Monto ($ ARS) *
              </label>
              <input 
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                className="w-full bg-surface border border-outline rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                required
              />
            </div>

            {/* Proveedor */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Proveedor *</label>
              <input 
                type="text"
                placeholder="Ej: Taller, Repuestos"
                value={proveedor}
                onChange={e => setProveedor(e.target.value)}
                className="w-full bg-surface border border-outline rounded-xl px-3 py-2 text-xs text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Factura A (Toggle Compacto) */}
          <div className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
            <div>
              <p className="text-xs font-bold text-on-surface">¿Tiene Factura A?</p>
              <p className="text-[9px] text-on-surface-variant">
                Genera crédito fiscal de IVA para la unidad.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={facturaA} 
                onChange={e => setFacturaA(e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-outline rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Archivo Comprobante (Compacto) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
              <Paperclip size={12} /> Comprobante Adjunto {gasto?.comprobante_url ? '(Reemplazar)' : '(Opcional)'}
            </label>
            <div className="flex justify-center px-4 py-4 border border-outline border-dashed rounded-xl hover:border-primary/50 transition-colors bg-surface-container-lowest relative">
              <div className="space-y-1 text-center">
                <Paperclip className="mx-auto h-5 w-5 text-on-surface-variant/40" />
                <div className="flex text-[11px] text-on-surface-variant justify-center">
                  <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-primary hover:underline">
                    <span>Subir archivo</span>
                    <input 
                      type="file" 
                      className="sr-only" 
                      onChange={handleFileChange}
                      accept=".pdf,image/*"
                    />
                  </label>
                </div>
                <p className="text-[9px] text-on-surface-variant">PDF, PNG, JPG (máx. 5MB)</p>
                {archivo && (
                  <p className="text-[10px] font-bold text-primary mt-1 truncate max-w-[300px]">
                    Seleccionado: {archivo.name}
                  </p>
                )}
                {!archivo && gasto?.comprobante_url && (
                  <p className="text-[10px] text-on-surface-variant italic mt-1">
                    Tiene comprobante adjunto.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Botones de acción */}
        <div className="p-4 border-t border-outline-variant/30 flex gap-2.5 justify-end bg-surface-container-low">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary/95 text-on-primary rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={12} /> Guardando...
              </>
            ) : (
              gasto ? 'Guardar Cambios' : 'Cargar Gasto'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
