import { fetchApi } from './client'

export const vehiculosApi = {
  getAll: () => fetchApi('/vehiculos/'),
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
}
