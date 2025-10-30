import React, { useState, useCallback, StrictMode } from "react";
import { FechaHorarioSelector } from "./FechaHorarioSelector";
import Mirabus from "./Mirabus";
import type { Seat, SeatStatus } from "./seatUtils/interfaceBus";

// --- DATOS DE EJEMPLO ---
// En una aplicación real, esto vendría de tu API/WebSocket.
const fetchSeatsForTrip = async (
  fecha: string,
  horario: string
): Promise<Seat[]> => {
  console.log(`Fetching seats for ${fecha} at ${horario}...`);
  // Simulamos una llamada a la API.
  // Aquí es donde te conectarías al WebSocket y obtendrías el estado inicial.
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Devolvemos datos de ejemplo. La estructura debe coincidir con tu API.
  return [
    // Array de prueba con 36 asientos. Layout: filas (y),columnas (x).
    // Fila 1
    { id: "01", x: 1, y: 1, status: "available" },
    { id: "02", x: 2, y: 1, status: "available" },
    { id: "03", x: 3, y: 1, status: "available" },
    { id: "04", x: 4, y: 1, status: "available" },
    { id: "05", x: 5, y: 1, status: "available" },
    { id: "06", x: 6, y: 1, status: "available" },
    { id: "07", x: 7, y: 1, status: "reserved" },
    { id: "08", x: 8, y: 1, status: "reserved" },
    { id: "09", x: 9, y: 1, status: "available" },
    // Fila 2
    { id: "10", x: 1, y: 2, status: "available" },
    { id: "11", x: 2, y: 2, status: "available" },
    { id: "12", x: 3, y: 2, status: "available" },
    { id: "13", x: 4, y: 2, status: "available" },
    { id: "14", x: 5, y: 2, status: "available" },
    { id: "15", x: 6, y: 2, status: "available" },
    { id: "16", x: 7, y: 2, status: "available" },
    { id: "17", x: 8, y: 2, status: "available" },
    { id: "18", x: 9, y: 2, status: "available" },
    // Fila 3
    { id: "19", x: 1, y: 4, status: "available" },
    { id: "20", x: 2, y: 4, status: "available" },
    { id: "21", x: 3, y: 4, status: "available" },
    { id: "22", x: 4, y: 4, status: "available" },
    { id: "23", x: 5, y: 4, status: "available" },
    { id: "24", x: 6, y: 4, status: "available" },
    { id: "25", x: 7, y: 4, status: "available" },
    { id: "26", x: 8, y: 4, status: "available" },
    { id: "27", x: 9, y: 4, status: "available" },
    // Fila 4
    { id: "28", x: 1, y: 5, status: "available" },
    { id: "29", x: 2, y: 5, status: "available" },
    { id: "30", x: 3, y: 5, status: "available" },
    { id: "31", x: 4, y: 5, status: "available" },
    { id: "32", x: 5, y: 5, status: "available" },
    { id: "33", x: 6, y: 5, status: "available" },
    { id: "34", x: 7, y: 5, status: "available" },
    { id: "35", x: 8, y: 5, status: "available" },
    { id: "36", x: 9, y: 5, status: "available" },
  ];
};

const fetchHorariosDisponibles = async (fecha: string): Promise<string[]> => {
  console.log(`Buscando horarios para ${fecha}`);
  // Simula una llamada a la API para obtener horarios
  await new Promise((resolve) => setTimeout(resolve, 300));
  return ["10:00 AM", "02:00 PM", "06:00 PM"];
};
// --- FIN DATOS DE EJEMPLO ---

//componente encargado de cargar con todo el formulario normal y la seleccion de asientos
export default function FormularioMirabus() {
  const [tripSelection, setTripSelection] = useState<{
    fecha: string;
    horario: string;
  } | null>(null);
  // Este estado ahora representa la "base de datos del servidor"
  const [serverSeats, setServerSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTripSelection = useCallback(
    async (fecha: string, horario: string) => {
      setTripSelection({ fecha, horario });
      setIsLoading(true);
      setSelectedSeats([]); // Limpiar selección al cambiar de viaje
      try {
        const seatsData = await fetchSeatsForTrip(fecha, horario);
        setServerSeats(seatsData);
        // Aquí establecerías la conexión WebSocket real para este viaje
      } catch (error) {
        console.error("Failed to fetch seats:", error);
        // Manejar el error en la UI
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSeatSelectionChange = useCallback(
    (newSelection: Seat[]) => {
      // Comparamos si la nueva selección es realmente diferente para evitar re-renders innecesarios.
      setSelectedSeats((prevSelected) => {
        if (JSON.stringify(prevSelected) !== JSON.stringify(newSelection)) {
          console.log("Asientos seleccionados en el formulario principal:", newSelection.map((s) => s.id));
          return newSelection;
        }
        return prevSelected;
      });
    },
    []
  );

  // --- SIMULACIÓN DE WEBSOCKET ---

  const updateSeatStatusOnServer = (seatId: string, status: SeatStatus) => {
    console.log(
      `[SIMULACIÓN SERVIDOR]: Recibida petición para cambiar ${seatId} a ${status}`
    );
    // Simula la latencia de la red
    setTimeout(() => {
      let success = false;
      setServerSeats((currentServerSeats) => {
        const seatToUpdate = currentServerSeats.find((s) => s.id === seatId);
        // El servidor solo permite cambiar asientos 'available'
        if (seatToUpdate && seatToUpdate.status === "available") {
          success = true;
          return currentServerSeats.map((s) =>
            s.id === seatId ? { ...s, status } : s
          );
        }
        // Si el asiento ya no está disponible, la petición falla.
        return currentServerSeats;
      });

      if (success) {
        console.log(`[SIMULACIÓN SERVIDOR]: Petición para ${seatId} APROBADA.`);
      } else {
        console.error(
          `[SIMULACIÓN SERVIDOR]: Petición para ${seatId} RECHAZADA (asiento no disponible).`
        );
        // En una app real, enviarías un mensaje de error de vuelta al cliente.
        // La UI del cliente se corregirá sola gracias a la "fusión inteligente".
      }
    }, 500 + Math.random() * 500); // Latencia aleatoria entre 0.5s y 1s
  };

  const handleRequestSeatSelection = (seatId: string) => {
    // El cliente pide seleccionar un asiento. El servidor lo marcará como 'selected'.
    // En un sistema real, podría ser 'pending' primero, pero para esta simulación 'selected' es suficiente.
    updateSeatStatusOnServer(seatId, "selected");
  };

  const handleRequestSeatDeselection = (seatId: string) => {
    // El cliente pide deseleccionar. El servidor lo devuelve a 'available'.
    setServerSeats((currentServerSeats) => {
      const seatToUpdate = currentServerSeats.find((s) => s.id === seatId);
      // Solo se puede deseleccionar algo que estaba 'selected'
      if (seatToUpdate && seatToUpdate.status === "selected") {
        console.log(`[SIMULACIÓN SERVIDOR]: Deseleccionando ${seatId}.`);
        return currentServerSeats.map((s) =>
          s.id === seatId ? { ...s, status: "available" } : s
        );
      }
      return currentServerSeats;
    });
  };

  // --- FIN DE SIMULACIÓN ---

  return (
    <StrictMode>
      <div>
        <FechaHorarioSelector
          onSelectionChange={handleTripSelection}
          fetchHorarios={fetchHorariosDisponibles}
        />
        {isLoading && <div>Cargando asientos...</div>}
        {!isLoading && serverSeats.length > 0 && (
          <Mirabus
            initialSeatsData={serverSeats}
            onSelectionChange={handleSeatSelectionChange}
            onRequestSeatSelection={handleRequestSeatSelection}
            onRequestSeatDeselection={handleRequestSeatDeselection}
          />
        )}
        {/* Aquí iría el resto de tu formulario (datos del pasajero, etc.) */}
      </div>
    </StrictMode>
  );
}
