import { useState, useEffect } from 'react';

export interface Actualizacion {
  id: string;
  fecha: string;
  tipo_cambio: string;
  titulo: string;
  resumen: string;
  detalles_md: string;
}

export const useChangelog = () => {
  const [actualizaciones, setActualizaciones] = useState<Actualizacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        // Agregamos un timestamp para evitar caché agresivo del navegador
        const response = await fetch(`/changelog.json?t=${new Date().getTime()}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el changelog');
        }
        const data = await response.json();
        
        // Ordenar por fecha descendente (más recientes primero)
        const sortedData = (data.actualizaciones || []).sort((a: Actualizacion, b: Actualizacion) => {
          return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
        });
        
        setActualizaciones(sortedData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChangelog();
  }, []);

  const hoy = new Date();
  // Función auxiliar para resetear la hora y solo comparar fechas
  const normalizeDate = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const fechaHoyStr = normalizeDate(hoy).toISOString().split('T')[0];

  // Agrupaciones lógicas
  const actualizacionesHoy = actualizaciones.filter(item => item.fecha === fechaHoyStr);
  
  const actualizacionesSemana = actualizaciones.filter(item => {
    if (item.fecha === fechaHoyStr) return false; // Ya están en "Hoy"
    const itemDate = new Date(item.fecha);
    const diffTime = Math.abs(hoy.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  const historial = actualizaciones.filter(item => {
    if (item.fecha === fechaHoyStr) return false;
    const itemDate = new Date(item.fecha);
    const diffTime = Math.abs(hoy.getTime() - itemDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  });

  const tieneNovedadHoy = actualizacionesHoy.length > 0;

  return {
    actualizaciones,
    actualizacionesHoy,
    actualizacionesSemana,
    historial,
    tieneNovedadHoy,
    isLoading,
    error
  };
};
