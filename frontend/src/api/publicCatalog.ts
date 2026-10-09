export interface PublicImagen {
  id: number;
  ruta: string;
  es_principal: boolean;
  orden: number;
}

export interface PublicVehiculo {
  id: number;
  marca?: string;
  modelo: string;
  precio_venta: number;
  moneda_venta?: 'USD' | 'PESOS';
  kilometraje: number;
  detalle_interior?: string;
  detalle_exterior?: string;
  informacion_extra?: string;
  anio: number;
  transmision: string;
  estado: string;
  imagenes: PublicImagen[];
  traccion?: string;
  tipo?: string;
  condicion?: string;
}

export const publicCatalogApi = {
  getVehiculos: async (): Promise<PublicVehiculo[]> => {
    const res = await fetch('/api/public/catalogo/', {
      headers: {
        'Accept': 'application/json',
        'X-VendedorIA-CRM-Vehiculos': 'true',
      },
    });

    if (!res.ok) {
      throw new Error('Error al cargar los vehículos del catálogo');
    }

    return res.json();
  },
};
