import React, { useState, useCallback, StrictMode } from "react";
import { FechaHorarioSelector } from "./FechaHorarioSelector";
import Mirabus from "./Mirabus";
import type { Seat } from "./seatUtils/interfaceBus";
import { useSocketTrip } from "../../../hooks/useSocketTrip";

const fetchHorariosDisponibles = async (fecha: string): Promise<string[]> => {
  console.log(`Buscando horarios para ${fecha}`);
  // Simula una llamada a la API para obtener horarios
  await new Promise((resolve) => setTimeout(resolve, 300));
  return ["10:00 AM", "02:00 PM", "06:00 PM"];
};

//componente encargado de cargar con todo el formulario normal y la seleccion de asientos
export default function FormularioMirabus() {
  // Estado para la UI: ¿estamos en modo selección?
  const [isSelecting, setIsSelecting] = useState(false);
  // Estado para el viaje seleccionado (fecha y hora)
  const [tripSelection, setTripSelection] = useState<{
    fecha: string;
    horario: string;
  } | null>(null);
  // Estado para el bus seleccionado en el <select>
  const [selectedBusOrden, setSelectedBusOrden] = useState<string | null>(null);

  // El hook que maneja toda la lógica de sockets
  const {
    buses,
    isConnected,
    isConnecting,
    connectToTrip,
    disconnectFromTrip,
    selectSeat,
    deselectSeat,
  } = useSocketTrip();

  // Estado local para guardar los asientos que el usuario ha seleccionado
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  const handleTripSelection = useCallback(
    async (fecha: string, horario: string) => {
      disconnectFromTrip(); // <-- ¡AQUÍ ESTÁ LA SOLUCIÓN!
      setTripSelection({ fecha, horario });
      setIsSelecting(false); // Volver al estado inicial si se cambia la fecha/hora
      setSelectedBusOrden(null);
    },
    [disconnectFromTrip]
  );

  const handleStartSelection = () => {
    if (tripSelection) {
      // TODO: Obtener el userId y servicio de algún contexto de autenticación/estado global
      const userId = "user-123";
      const servicio = "MIRABUS";
      connectToTrip({ ...tripSelection, userId, servicio });
      setIsSelecting(true);
    }
  };

  // Buscamos el bus seleccionado para pasarlo al componente Mirabus
  const busToDisplay = buses.find((b) => b.ordenBus === selectedBusOrden);
  if (buses.length > 0 && !selectedBusOrden) {
    setSelectedBusOrden(buses[0].ordenBus);
  };

  return (
    <StrictMode>
      <div>
        <FechaHorarioSelector
          onSelectionChange={handleTripSelection}
          fetchHorarios={fetchHorariosDisponibles}
        />

        {tripSelection && !isSelecting && (
          <button onClick={handleStartSelection} className="mt-4 p-2 bg-blue-500 text-white rounded">
            Seleccionar Asientos
          </button>
        )}

        {isConnecting && <div>Conectando...</div>}

        {isConnected && (
          <div>
            {buses.length > 1 && (
              <select
                value={selectedBusOrden || ""}
                onChange={(e) => setSelectedBusOrden(e.target.value)}
                className="mt-4 p-2 border rounded"
              >
                {buses.map((bus) => (
                  <option key={bus.ordenBus} value={bus.ordenBus}>
                    {`Bus ${bus.ordenBus}`}
                  </option>
                ))}
              </select>
            )}

            {busToDisplay && (
              <Mirabus
                key={busToDisplay.ordenBus} // Importante para que React remonte el componente al cambiar de bus
                initialSeatsData={busToDisplay.seats}
                busOrden={busToDisplay.ordenBus}
                onSelectionChange={setSelectedSeats}
                onRequestSeatSelection={selectSeat}
                onRequestSeatDeselection={deselectSeat}
              />
            )}
          </div>
        )}
        {/* Aquí iría el resto de tu formulario (datos del pasajero, etc.) */}
      </div>
    </StrictMode>
  );
}
