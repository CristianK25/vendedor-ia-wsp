import { fetchApi } from './client'

export const clientesApi = {
  getAll: () => fetchApi('/clientes/'),
  getByTelefono: (telefono: string) => fetchApi(`/clientes/${telefono}`),
  create: (data: any) => fetchApi('/clientes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (telefono: string, data: any) => fetchApi(`/clientes/${telefono}`, { method: 'PUT', body: JSON.stringify(data) }),
}
