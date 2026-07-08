export interface Imagen {
  id: number
  ruta: string
  es_principal: boolean
  orden: number
}

export interface Vehiculo {
  id: number
  modelo: string
  precio: number
  kilometraje: number
  detalle_interior?: string
  detalle_exterior?: string
  informacion_extra?: string
  estado: string
  imagenes: Imagen[]
}

export interface VehiculoCreate {
  modelo: string
  precio: number
  kilometraje: number
  detalle_interior?: string
  detalle_exterior?: string
  informacion_extra?: string
}

export interface Venta {
  id: number
  vehiculo_id: number
  cliente_telefono: string
  fecha: string
  precio_final: number
}

export interface VentaCreate {
  vehiculo_id: number
  cliente_telefono: string
  precio_final: number
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
  telefono: string
  rol: string
}

export interface TrabajadorCreate {
  nombre: string
  telefono: string
  rol?: string
}
