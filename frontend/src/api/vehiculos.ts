import { fetchApi } from './client'

export const vehiculosApi = {
  getAll: () => fetchApi('/vehiculos/'),
  getCatalogo: () => fetchApi('/vehiculos/catalogo'),
  getById: (id: number) => fetchApi(`/vehiculos/${id}`),
  create: (data: any) => fetchApi('/vehiculos/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/vehiculos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/vehiculos/${id}`, { method: 'DELETE' }),
}
