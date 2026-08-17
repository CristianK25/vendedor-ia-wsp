export type CategoriaGasto =
  | 'mecanica'
  | 'detailing_preparacion'
  | 'repuestos'
  | 'flete'
  | 'patentes_tramites'
  | 'otros';

export interface GastoVehiculo {
  id: number;
  vehiculo_id: number;
  fecha: string;
  categoria: CategoriaGasto;
  monto: number;
  proveedor: string;
  factura_a: boolean;
  comprobante_url?: string;
  fecha_hora_carga: string;
}

export interface ResumenGastosVehiculo {
  total_gastos: number;
  total_factura_a: number;
  iva_recuperable: number;
  costo_total_unidad?: number;
  gastos: GastoVehiculo[];
}
