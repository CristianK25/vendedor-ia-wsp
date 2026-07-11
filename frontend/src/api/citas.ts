import { fetchApi } from './client'

export const citasApi = {
  getAll: () => fetchApi('/citas/'),
  getById: (id: number) => fetchApi(`/citas/${id}`),
  create: (data: any) => fetchApi('/citas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/citas/${id}`, { method: 'DELETE' }),
  getHoyByVehiculo: (vehiculoId: number) => fetchApi(`/citas/vehiculo/${vehiculoId}/hoy`).catch(e => {
    if (e.status === 404) return null;
    throw e;
  }),
}
