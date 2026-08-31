import FilterBar from "@/components/catalog/FilterBar";
import VehicleList from "@/components/catalog/VehicleList";
import type { VehicleData } from "@/types/vehicle";

// Datos de prueba temporales (Mock Data)
const mockVehicles: VehicleData[] = [
  {
    id: 1,
    marca: "Porsche",
    modelo: "911 Carrera S",
    year: 2021,
    precio: "$145,000 USD",
    imagen: "https://images.unsplash.com/photo-1503376713208-b4bb181e113d?q=80&w=1920&auto=format&fit=crop",
    kilometraje: "12,500",
    transmision: "Automática (PDK)",
    combustible: "Nafta",
    traccion: "Trasera (RWD)"
  },
  {
    id: 2,
    marca: "Range Rover",
    modelo: "Autobiography",
    year: 2023,
    precio: "$185,000 USD",
    imagen: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1920&auto=format&fit=crop",
    kilometraje: "5,200",
    transmision: "Automática",
    combustible: "Híbrido",
    traccion: "Integral (AWD)"
  }
];

export default function CatalogoPage() {
  return (
    <div className="w-full">
      <FilterBar />
      <VehicleList vehicles={mockVehicles} />
    </div>
  );
}
