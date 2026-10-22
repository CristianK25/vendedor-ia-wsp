/**
 * Configuración dinámica del Catálogo Público
 * Puedes editar los valores directamente en este archivo o definir variables de entorno (ej. en .env)
 */

export interface CatalogVehicleInfo {
  marca?: string;
  modelo: string;
  anio: number;
  precio_venta: number;
  moneda_venta?: string;
}

export const CATALOG_CONFIG = {
  // Nombre comercial que se muestra en la cabecera o footer del catálogo (o variable de entorno)
  concesionariaNombre: (import.meta as any).env?.VITE_CONCESIONARIA_NOMBRE || 'Catálogo Automotor',

  // Enlace a Instagram (opcional, configurable vía .env)
  instagramUrl: (import.meta as any).env?.VITE_INSTAGRAM_URL || '',

  // Número de WhatsApp al que llegarán las consultas (código de país sin '+' ni espacios, ej: '5491112345678')
  // Se puede sobreescribir con la variable de entorno VITE_WHATSAPP_PHONE o editar directamente aquí
  whatsappPhone: (import.meta as any).env?.VITE_WHATSAPP_PHONE || '5492617752457',

  // Mensaje base para iniciar la conversación por WhatsApp
  generarMensajeWhatsApp: (vehiculo: CatalogVehicleInfo): string => {
    const nombreVehiculo = vehiculo.marca ? `${vehiculo.marca} ${vehiculo.modelo}` : vehiculo.modelo;
    const moneda = vehiculo.moneda_venta === 'USD' ? 'USD' : 'ARS';
    const precio = vehiculo.precio_venta.toLocaleString();

    const prefijo = vehiculo.moneda_venta === 'USD' ? 'U$S' : '$';
    
    return `¡Hola! Vengo del catálogo web y me interesa consultar por el vehículo:\n*${nombreVehiculo}* (${vehiculo.anio})\n*Precio:* ${prefijo}${precio} ${moneda}\n\n¿Sigue disponible? Me gustaría recibir más información.`;
  },

  // Generador de enlace completo de WhatsApp
  obtenerEnlaceWhatsApp: (vehiculo: CatalogVehicleInfo): string => {
    const telefono = CATALOG_CONFIG.whatsappPhone.replace(/[^0-9]/g, '');
    const mensaje = CATALOG_CONFIG.generarMensajeWhatsApp(vehiculo);
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  }
};
