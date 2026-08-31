import VehicleCard from "./VehicleCard";
import type { VehicleData } from "@/types/vehicle";

interface VehicleListProps {
  vehicles: VehicleData[];
}

export default function VehicleList({ vehicles }: VehicleListProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-on-surface-variant font-body-lg">
        <p>No hay vehículos disponibles en este momento.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {vehicles.map((vehicle, index) => (
        <VehicleCard 
          key={vehicle.id} 
          vehicle={vehicle} 
          // La magia está aquí: alternamos la foto izq/der basándonos en si el índice es par o impar
          imageLeft={index % 2 === 0} 
        />
      ))}
    </div>
  );
}
