import { fetchApi } from './client'

export const ventasApi = {
  getAll: () => fetchApi('/ventas/'),
  getById: (id: number) => fetchApi(`/ventas/${id}`),
  create: (data: any) => fetchApi('/ventas/', { method: 'POST', body: JSON.stringify(data) }),
}
