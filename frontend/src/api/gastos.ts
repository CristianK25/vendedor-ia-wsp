import { fetchApi } from './client';
import type { ResumenGastosVehiculo, GastoVehiculo } from '../types/gasto';

export const gastosApi = {
  getResumen: (vehiculoId: number): Promise<ResumenGastosVehiculo> =>
    fetchApi(`/gastos/vehiculo/${vehiculoId}`),

  crear: (vehiculoId: number, data: any, file?: File): Promise<GastoVehiculo> => {
    const formData = new FormData();
    formData.append('gasto', JSON.stringify(data));
    if (file) {
      formData.append('archivo', file);
    }
    return fetchApi(`/gastos/vehiculo/${vehiculoId}`, {
      method: 'POST',
      body: formData,
    });
  },

  editar: (gastoId: number, data: any, file?: File): Promise<GastoVehiculo> => {
    const formData = new FormData();
    formData.append('gasto', JSON.stringify(data));
    if (file) {
      formData.append('archivo', file);
    }
    return fetchApi(`/gastos/${gastoId}`, {
      method: 'PUT',
      body: formData,
    });
  },

  eliminar: (gastoId: number): Promise<{ message: string }> =>
    fetchApi(`/gastos/${gastoId}`, {
      method: 'DELETE',
    }),
};
