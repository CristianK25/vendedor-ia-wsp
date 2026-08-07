export interface Imagen {
  id: number
  ruta: string
  es_principal: boolean
  orden: number
}

export type EtapaVehiculo = 'pre_compra' | 'comprado' | 'en_stock' | 'vendido';
export type TipoDocumento = 
  | 'informe_dominio' | 'deuda_patentes' 
  | 'boleto_compra' | 'dni_vendedor' | 'cedula_vehiculo' | 'formulario_08' 
  | 'contrato_consignacion' 
  | 'boleto_venta' | 'verificacion_policial' | 'dni_comprador' | 'formulario_08_12' | 'factura_venta' | 'circuito_plata';

export interface DocumentoVehiculo {
  id: number;
  vehiculo_id: number;
  etapa: EtapaVehiculo;
  tipo_documento: TipoDocumento;
  ruta_archivo: string;
  nombre_original: string;
  version?: number;
  fecha_subida: string;
}

export interface Vehiculo {
  id: number
  modelo: string
  precio_venta: number
  precio_compra?: number
  origen_compra?: 'particular' | 'ri_factura_a'
  kilometraje: number
  detalle_interior?: string
  detalle_exterior?: string
  informacion_extra?: string
  anio: number
  transmision: string
  patente: string
  estado: string
  imagenes: Imagen[]
  traccion?: string
  tipo?: string
  condicion?: string
  etapa?: EtapaVehiculo
  documentos?: DocumentoVehiculo[]
  tipo_alta?: 'compra_directa' | 'consignacion'
  dueno_telefono?: string
  precio_acordado?: number
  comision_tipo?: 'porcentaje' | 'monto_fijo'
  comision_valor?: number
}

export interface VehiculoCreate {
  modelo: string
  precio_venta: number
  precio_compra?: number
  origen_compra?: 'particular' | 'ri_factura_a'
  kilometraje: number
  detalle_interior?: string
  detalle_exterior?: string
  informacion_extra?: string
  anio: number
  transmision: string
  patente: string
  traccion: string
  tipo: string
  condicion: string
  tipo_alta?: 'compra_directa' | 'consignacion'
  dueno_telefono?: string
  precio_acordado?: number
  comision_tipo?: 'porcentaje' | 'monto_fijo'
  comision_valor?: number
}

export interface Venta {
  id: number
  vehiculo_id: number
  vehiculo_modelo?: string
  tipo_venta?: string
  cliente_telefono: string
  cliente_nombre?: string
  fecha: string
  precio_final: number
}

export interface VentaCreate {
  vehiculo_id: number
  cliente_telefono: string
  precio_final: number
  estado_vehiculo?: string
}

export interface Cliente {
  telefono: string
  nombre?: string
  ultimo_mensaje_bot?: string
  ultima_interaccion_cliente?: string
  cantidad_compras: number
}

export interface ClienteCreate {
  telefono: string
  nombre?: string
}

export interface Promocion {
  id: number
  titulo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
}

export interface PromocionCreate {
  titulo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
}

export interface Trabajador {
  id: number
  nombre: string
  apellido?: string
  email?: string
  rol_sistema?: string
  telefono?: string
  rol?: string
  recibe_notificaciones?: boolean
}

export interface TrabajadorCreate {
  nombre: string
  apellido: string
  email: string
  password?: string
  rol: string
  telefono?: string
  rol_trabajador?: string
}

export interface Cita {
  id: number
  cliente_telefono: string
  cliente_nombre?: string
  vehiculo_id?: number
  vehiculo_modelo?: string
  vehiculo_patente?: string
  fecha: string
  fecha_creacion: string
  estado: string
}

export interface CitaCreate {
  cliente_telefono: string
  vehiculo_id?: number
  fecha: string
  estado?: string
}

export interface Peticion {
  id: number
  cliente_nombre: string
  cliente_telefono: string
  vehiculo_modelo?: string
  fecha_propuesta: string
  origen: string
  estado: string
  peticion_padre_id?: number
}
