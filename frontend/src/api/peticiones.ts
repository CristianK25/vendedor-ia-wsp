import { fetchApi } from './client'

export const peticionesApi = {
  getAll: () => fetchApi('/peticiones/'),
  aceptar: (id: number) => fetchApi(`/peticiones/${id}/aceptar`, { method: 'POST' }),
  posponer: (id: number, fecha_propuesta: string) => fetchApi(`/peticiones/${id}/posponer`, { 
    method: 'POST', 
    body: JSON.stringify({ fecha_propuesta }) 
  }),
  cancelar: (id: number) => fetchApi(`/peticiones/${id}/cancelar`, { method: 'POST' }),
  forzarConfirmacion: (id: number) => fetchApi(`/peticiones/${id}/forzar_confirmacion`, { method: 'POST' })
}
