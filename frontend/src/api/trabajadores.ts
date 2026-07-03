import { fetchApi } from './client'

export const trabajadoresApi = {
  getAll: () => fetchApi('/trabajadores/'),
  getById: (id: number) => fetchApi(`/trabajadores/${id}`),
  create: (data: any) => fetchApi('/trabajadores/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/trabajadores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/trabajadores/${id}`, { method: 'DELETE' }),
}
