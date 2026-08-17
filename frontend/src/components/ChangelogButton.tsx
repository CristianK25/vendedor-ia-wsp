import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useChangelog } from '../hooks/useChangelog';
import { ChangelogDrawer } from './modals/ChangelogDrawer';

export const ChangelogButton: React.FC = () => {
  const { tieneNovedadHoy } = useChangelog();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="relative p-2 rounded-full hover:bg-surface-variant text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
        title="Novedades y Actualizaciones"
      >
        <Bell size={20} />
        
        {/* Punto Rojo (Indicador de Novedad Hoy) */}
        {tieneNovedadHoy && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface animate-pulse" />
        )}
      </button>

      <ChangelogDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </>
  );
};
