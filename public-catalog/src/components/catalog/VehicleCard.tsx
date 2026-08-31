import { Gauge, Settings, Car, Fuel, MessageCircle } from "lucide-react";
import type { VehicleData } from "@/types/vehicle";

interface VehicleCardProps {
  vehicle: VehicleData;
  // Este boolean nos permite alternar si la foto va a la izquierda o a la derecha
  imageLeft?: boolean;
}

export default function VehicleCard({ vehicle, imageLeft = true }: VehicleCardProps) {
  // Construimos el título uniendo marca y modelo
  const titulo = `${vehicle.marca} ${vehicle.modelo}`;

  return (
    <section 
      className={`flex flex-col ${imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'} w-full min-h-[85vh] max-w-container-max mx-auto ${!imageLeft ? 'bg-info-bg' : ''}`}
    >
      {/* Contenedor de la Imagen */}
      <div className="w-full md:w-[55%] h-[50vh] md:h-auto relative p-8 md:p-16">
        <img 
          className="w-full h-full object-cover rounded-xl shadow-2xl" 
          src={vehicle.imagen}
          alt={titulo}
        />
      </div>

      {/* Contenedor de la Información */}
      <div className={`w-full md:w-[45%] flex flex-col justify-center items-center p-12 md:p-24 text-center md:px-margin-page ${imageLeft ? 'bg-surface-container-lowest' : 'bg-info-bg'}`}>
        
        <h1 className="font-display-lg text-headline-md md:text-display-lg text-on-surface mb-4 leading-tight">
          {titulo}
        </h1>
        
        <p className="font-headline-md text-headline-md text-on-surface-variant opacity-80 mb-8 italic">
          {vehicle.year}
        </p>
        
        <div className="w-12 h-[2px] bg-primary mb-8 opacity-60"></div>
        
        <p className="font-headline-lg text-headline-lg bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent mb-12">
          {vehicle.precio}
        </p>

        {/* Lista de Especificaciones Técnicas */}
        <ul className="space-y-6 mb-16 text-left w-full max-w-sm mx-auto border-t border-b border-outline-variant/30 py-8">
          
          <li className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Gauge className="text-outline" size={20} strokeWidth={1.5} />
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Kilometraje
              </span>
            </div>
            <span className="font-body-md text-on-surface">{vehicle.kilometraje}</span>
          </li>

          <li className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings className="text-outline" size={20} strokeWidth={1.5} />
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Transmisión
              </span>
            </div>
            <span className="font-body-md text-on-surface">{vehicle.transmision}</span>
          </li>

          {vehicle.combustible && (
            <li className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Fuel className="text-outline" size={20} strokeWidth={1.5} />
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Combustible
                </span>
              </div>
              <span className="font-body-md text-on-surface">{vehicle.combustible}</span>
            </li>
          )}

          {vehicle.traccion && (
            <li className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Car className="text-outline" size={20} strokeWidth={1.5} />
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                  Tracción
                </span>
              </div>
              <span className="font-body-md text-on-surface">{vehicle.traccion}</span>
            </li>
          )}

        </ul>

        {/* Botón de WhatsApp */}
        {/* TODO: Implementar href real de WhatsApp usando la variable de entorno o config global */}
        <a 
          href="#"
          className="bg-gradient-to-r from-primary to-primary-container text-on-primary font-body-lg text-body-lg px-10 py-5 hover:opacity-90 transition-opacity flex items-center justify-center gap-3 rounded-full w-full md:max-w-sm"
        >
          <MessageCircle size={24} />
          Consultar por WhatsApp
        </a>

      </div>
    </section>
  );
}
