import { fetchApi } from './client'

export const vehiculosApi = {
  getAll: (filters: any = {}) => {
    const params = new URLSearchParams();
    
    // Solo agregamos los parámetros que existen
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.size) params.append('size', filters.size.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.precio_min) params.append('precio_min', filters.precio_min.toString());
    if (filters.precio_max) params.append('precio_max', filters.precio_max.toString());
    if (filters.km_min) params.append('km_min', filters.km_min.toString());
    if (filters.km_max) params.append('km_max', filters.km_max.toString());
    if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
    if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
    if (filters.transmision) params.append('transmision', filters.transmision);
    if (filters.traccion) params.append('traccion', filters.traccion);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.condicion) params.append('condicion', filters.condicion);
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    if (filters.sortDir) params.append('sort_dir', filters.sortDir);
    
    return fetchApi(`/vehiculos/?${params.toString()}`);
  },
  getStats: () => fetchApi('/vehiculos/stats'),
  getCatalogo: () => fetchApi('/vehiculos/catalogo'),
  getById: (id: number) => fetchApi(`/vehiculos/${id}`),
  create: (data: any) => {
    const formData = new FormData()
    
    // Separamos las imágenes de los datos del vehículo
    const { imagenes, ...vehiculoData } = data
    
    // El backend espera el JSON de los datos del vehículo como string en el campo 'vehiculo'
    formData.append('vehiculo', JSON.stringify(vehiculoData))
    
    // Adjuntamos las imágenes si existen
    if (Array.isArray(imagenes)) {
      imagenes.forEach((file: File) => {
        formData.append('imagenes', file)
      })
    } else if (imagenes) {
      formData.append('imagenes', imagenes)
    }
    
    return fetchApi('/vehiculos/', {
      method: 'POST',
      body: formData,
    })
  },
  update: (id: number, data: any) => fetchApi(`/vehiculos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/vehiculos/${id}`, { method: 'DELETE' }),
  deleteUnified: (id: number) => fetchApi(`/vehiculos/${id}/venta_y_vehiculo`, { method: 'DELETE' }),
  getDocumentos: (id: number) => fetchApi(`/vehiculos/${id}/documentos`),
  subirDocumento: (id: number, etapa: string, tipoDocumento: string, archivo: File) => {
    const formData = new FormData()
    formData.append('etapa', etapa)
    formData.append('tipo_documento', tipoDocumento)
    formData.append('archivo', archivo)
    
    return fetchApi(`/vehiculos/${id}/documentos`, {
      method: 'POST',
      body: formData,
    })
  },
  avanzarEtapa: (id: number) => fetchApi(`/vehiculos/${id}/avanzar-etapa`, { method: 'PUT' }),
}
