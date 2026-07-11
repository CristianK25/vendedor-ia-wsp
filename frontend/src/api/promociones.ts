import { fetchApi } from './client'

export const promocionesApi = {
  getAll: (page = 1, size = 50, search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      search
    });
    return fetchApi(`/promociones/?${params.toString()}`);
  },
  getActivas: () => fetchApi('/promociones/activas'),
  getById: (id: number) => fetchApi(`/promociones/${id}`),
  create: (data: any) => fetchApi('/promociones/', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => fetchApi(`/promociones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => fetchApi(`/promociones/${id}`, { method: 'DELETE' }),
}
