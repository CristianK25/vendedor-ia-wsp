import { fetchApi } from './client'

export const ventasApi = {
  getAll: (page = 1, size = 50, search = '', sortBy = '', sortDir = 'asc') => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      search,
      sort_by: sortBy,
      sort_dir: sortDir
    });
    return fetchApi(`/ventas/?${params.toString()}`);
  },
  getById: (id: number) => fetchApi(`/ventas/${id}`),
  getByVehiculoId: (id: number) => fetchApi(`/ventas/vehiculo/${id}`),
  create: (data: any) => fetchApi('/ventas/', { method: 'POST', body: JSON.stringify(data) }),
}
