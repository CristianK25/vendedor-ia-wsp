import { fetchApi } from './client'

export const clientesApi = {
  getAll: (page = 1, size = 50, search = '', sortBy = '', sortDir = 'asc') => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      search,
      sort_by: sortBy,
      sort_dir: sortDir
    });
    return fetchApi(`/clientes/?${params.toString()}`);
  },
  getByTelefono: (telefono: string) => fetchApi(`/clientes/${telefono}`),
  create: (data: any) => fetchApi('/clientes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (telefono: string, data: any) => fetchApi(`/clientes/${telefono}`, { method: 'PUT', body: JSON.stringify(data) }),
}
