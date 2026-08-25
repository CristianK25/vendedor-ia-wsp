import { fetchApi } from './client'

export const clientesApi = {
  getAll: (page = 1, size = 50, search = '', sortBy = '', sortDir = 'asc', etiquetaId: number | null = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      search,
      sort_by: sortBy,
      sort_dir: sortDir
    });
    if (etiquetaId !== null) {
      params.append('etiqueta_id', etiquetaId.toString());
    }
    return fetchApi(`/clientes/?${params.toString()}`);
  },
  getByTelefono: (telefono: string) => fetchApi(`/clientes/${telefono}`),
  create: (data: any) => fetchApi('/clientes/', { method: 'POST', body: JSON.stringify(data) }),
  update: (telefono: string, data: any) => fetchApi(`/clientes/${telefono}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (telefono: string) => fetchApi(`/clientes/${telefono}`, { method: 'DELETE' }),
}

export const etiquetasApi = {
  getAll: () => fetchApi('/etiquetas/'),
  create: (data: { nombre: string; color: string }) => fetchApi('/etiquetas/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: { nombre: string; color: string }) => fetchApi(`/etiquetas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/etiquetas/${id}`, { method: 'DELETE' }),
}
