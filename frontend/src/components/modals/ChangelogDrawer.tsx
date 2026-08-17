import React, { useState } from 'react';
import { X, Calendar, ArrowRight, Tag, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChangelog, type Actualizacion } from '../../hooks/useChangelog';

interface ChangelogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangelogDrawer: React.FC<ChangelogDrawerProps> = ({ isOpen, onClose }) => {
  const { actualizacionesHoy, actualizacionesSemana, historial, isLoading } = useChangelog();
  const [selectedUpdate, setSelectedUpdate] = useState<Actualizacion | null>(null);

  React.useEffect(() => {
    if (!selectedUpdate && !isLoading && isOpen) {
      const defaultUpdate = actualizacionesHoy[0] || actualizacionesSemana[0] || historial[0];
      if (defaultUpdate) {
        setSelectedUpdate(defaultUpdate);
      }
    }
  }, [isLoading, actualizacionesHoy, actualizacionesSemana, historial, selectedUpdate, isOpen]);

  if (!isOpen) return null;

  const renderBadge = (tipo: string) => {
    let colorClass = "bg-surface-variant text-on-surface-variant";
    if (tipo === 'Nueva Función') colorClass = "bg-primary-container text-on-primary-container";
    if (tipo === 'Mejora Visual') colorClass = "bg-secondary-container text-on-secondary-container";
    if (tipo === 'Corrección') colorClass = "bg-yellow-500/20 text-yellow-500"; // fallback if no specific warning variable
    
    return (
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
        {tipo}
      </span>
    );
  };

  const renderList = (items: Actualizacion[], title: string, icon: React.ReactNode) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-2">
          {icon} {title}
        </h3>
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedUpdate(item)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedUpdate?.id === item.id 
                  ? 'bg-surface-variant border-primary border-l-4' 
                  : 'bg-surface border-outline-variant hover:border-outline'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                {renderBadge(item.tipo_cambio)}
                <span className="text-[10px] text-on-surface-variant">{item.fecha}</span>
              </div>
              <h4 className="text-sm font-semibold text-on-surface leading-tight mt-2">{item.titulo}</h4>
              <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{item.resumen}</p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-4xl bg-background border-l border-outline h-full shadow-2xl flex flex-col sm:flex-row transform transition-transform duration-300">
        
        {/* Left Panel: List */}
        <div className="w-full sm:w-1/3 h-full border-r border-outline flex flex-col bg-surface-container-lowest">
          <div className="p-4 border-b border-outline flex justify-between items-center bg-surface">
            <h2 className="text-lg font-bold text-on-surface">Actualizaciones</h2>
            {/* Botón cerrar para versión móvil, en PC está en la esquina del panel derecho */}
            <button onClick={onClose} className="sm:hidden p-2 hover:bg-surface-variant rounded-full text-on-surface-variant">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {renderList(actualizacionesHoy, "Hoy", <Sparkles size={14} className="text-primary" />)}
                {renderList(actualizacionesSemana, "Esta Semana", <Calendar size={14} />)}
                {renderList(historial, "Historial Antiguo", <Tag size={14} />)}
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Detail */}
        <div className="w-full sm:w-2/3 h-full flex flex-col bg-surface relative">
          <button 
            onClick={onClose} 
            className="hidden sm:flex absolute top-4 right-4 p-2 bg-surface-variant hover:bg-surface-bright rounded-full text-on-surface-variant transition-colors z-10"
          >
            <X size={20} />
          </button>

          {selectedUpdate ? (
            <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    {renderBadge(selectedUpdate.tipo_cambio)}
                    <span className="text-sm text-on-surface-variant flex items-center gap-1">
                      <Calendar size={14}/> {selectedUpdate.fecha}
                    </span>
                    <span className="text-sm text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">
                      {selectedUpdate.id}
                    </span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-on-surface leading-tight">
                    {selectedUpdate.titulo}
                  </h1>
                </div>

                <div>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold text-on-surface mt-6 mb-3 pb-2 border-b border-outline-variant">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold text-on-surface mt-5 mb-2.5">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mt-6 mb-3">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-sm font-semibold text-on-surface mt-3 mb-1">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-2 text-sm text-on-surface-variant mb-4 pl-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1.5 text-sm text-on-surface-variant mb-4 pl-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="flex-1">{children}</span>
                        </li>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                          <table className="w-full text-left text-sm border-collapse">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-surface-variant/60 border-b border-outline-variant">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="py-3 px-4 font-semibold text-xs text-on-surface uppercase tracking-wider">
                          {children}
                        </th>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-outline-variant/40">
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-surface-variant/20 transition-colors">
                          {children}
                        </tr>
                      ),
                      td: ({ children }) => (
                        <td className="py-3 px-4 text-sm text-on-surface-variant align-top">
                          {children}
                        </td>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-on-surface">
                          {children}
                        </strong>
                      ),
                      hr: () => (
                        <hr className="my-6 border-outline-variant" />
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary bg-surface-variant/20 px-4 py-2.5 my-4 rounded-r-lg italic text-sm text-on-surface-variant">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-surface-variant text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                          {children}
                        </code>
                      ),
                    }}
                  >
                    {selectedUpdate.detalles_md}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8 text-center">
              <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
                <ArrowRight size={24} className="text-primary" />
              </div>
              <p>Selecciona una actualización de la lista para ver los detalles.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
