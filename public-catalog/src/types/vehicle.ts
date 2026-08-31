export interface VehicleData {
  id: string | number;
  marca: string;
  modelo: string;
  year: number;
  precio: string;
  imagen: string;
  kilometraje: string;
  transmision: string;
  combustible?: string;
  traccion?: string;
}
