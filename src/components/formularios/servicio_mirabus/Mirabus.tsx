import React, { useState, useCallback, useMemo } from "react";
import AsientoBus from "./AsientosBus";
import { FechaHorarioSelector } from "./FechaHorarioSelector";
import type { Seat, SeatStatus } from "./seatUtils/interfaceBus";
import { useSeatSelectionLogic } from "./seatUtils/useSeatSelectionLogic";
import { getAdjacentSeats } from "./seatUtils/seatFunctions";

interface MirabusProps {
  initialSeatsData: Seat[];
  onSelectionChange: (selectedSeats: Seat[]) => void;
  // En el futuro, aquí podrías pasar funciones para enviar eventos WebSocket
  // onSeatSelectAction: (seatId: string) => void;
  // onSeatDeselectAction: (seatId: string) => void;
}

export default function Mirabus({ initialSeatsData, onSelectionChange }: MirabusProps) {
  // usamos useState para que React pueda re-renderizar el componente cuando los asientos cambien
  const [seats, setSeats] = useState<Seat[]>(initialSeatsData);

  // Sincronizar el estado si los datos iniciales cambian (ej: al seleccionar otro horario)
  React.useEffect(() => {
    setSeats(initialSeatsData);
  }, [initialSeatsData]);

  //  cargar las herramientas necesarias con las funciones
  const { areSeatsContiguous, wouldSplitBlock } =
    useSeatSelectionLogic(initialSeatsData);

  // funcion que maneja el click en un asiento
  const seatSelectHandler = useCallback(
    (seatId: string) => {
      setSeats((currentSeats) => {
        // la logica de validacion se aplica aqui para usar siempre el estado más reciente
        
        const seatToToggle = currentSeats.find((s) => s.id === seatId); // Aquí también se validaría el estado 'pending'
        if (!seatToToggle || seatToToggle.status === 'occupied' || seatToToggle.status === 'reserved' || seatToToggle.status === 'blocked') {
          console.warn(`Acción bloqueada: El asiento ${seatId} no está disponible o no existe.`);
          return currentSeats; // no hacer nada si el asiento no es seleccionable
        }

        const isSelecting = seatToToggle.status !== "selected";

        //crear un estado hipotetico con el asiento añadido o quitado
        const hypotheticalSeats = currentSeats.map((seat) => {
          if (seat.id === seatId) {
            const newStatus: SeatStatus = isSelecting
              ? "selected"
              : "available";
            return { ...seat, status: newStatus };
          }
          return seat;
        });

        // validar el estado hipotético.
        const newSelection = hypotheticalSeats.filter(
          (s) => s.status === "selected"
        );

        if (isSelecting) {
          //intento de seleccion
          console.log("Intentando seleccionar:", seatId);
          if (!areSeatsContiguous(newSelection)) {
            console.warn(
              `Acción bloqueada: La selección debe formar un único bloque.`
            );
            return currentSeats;
          }
          //
          //paso la verificacion, ahora aca se puede implementar la logica websocket si es seleccionado
          //
          console.log("Asiento seleccionado correctamente")
        } else {
          //al deseleccionar, verificamos si la acción parte el bloque
          console.log("Intentando deseleccionar:", seatId);
          const currentSelection = currentSeats.filter(
            (s) => s.status === "selected"
          );
          if (wouldSplitBlock(seatId, currentSelection)) {
            console.warn(
              `Acción bloqueada: No se puede deseleccionar un asiento que parte el bloque.`
            );
            return currentSeats;
          }
          //
          //paso la verificacion, ahora aca se puede implementar la logica websocket si es deseleccionado
          //
        }

        // si es válida, aplicar el cambio.
        // notificar al componente padre sobre la nueva seleccion de asientos
        onSelectionChange(newSelection);
        return hypotheticalSeats;
      });

      // seccion dedicada a los eventos de ws
      // Por ejemplo: sendMessage({ action: 'select', seatId });

    },
    [areSeatsContiguous, wouldSplitBlock]
  );


  // logica de UI para determinar qué asientos mostrar (incluyendo los bloqueados)
  // se calcula cada vez que el estado 'seats' cambia
  const displaySeats = useMemo(() => {
    const selectedSeats = seats.filter((s) => s.status === "selected");

    if (selectedSeats.length === 0) {
      // si no hay nada seleccionado, todos los asientos 'blocked' vuelven a 'available'
      const valid :SeatStatus = "available";
      return seats.map((s) =>
        s.status === "blocked" ? { ...s, status: valid } : s
      );
    }

    // formamos la lista de permitidos excluyendo preterderminadamente los ocupados o reservados
    const allowedSeatIds = new Set(
      selectedSeats
        .flatMap((sel) => getAdjacentSeats(sel, seats))
        .filter((s) => s.status !== "occupied" && s.status !== "reserved" && s.status !== "pending")
        .map((s) => s.id)
    );

    return seats.map((s): Seat => {
      if (
        s.status === "occupied" ||
        s.status === "reserved" ||
        s.status === "selected" ||
        s.status === "pending" // Los asientos 'pending' también deben mantener su estado
      ) {
        return s;
      }
      // si el asiento no está en la lista de permitidos se bloquea
      const newStatus: SeatStatus = allowedSeatIds.has(s.id)
        ? "available"
        : "blocked";
      return { ...s, status: newStatus };
    });
  }, [seats]);

  //el error que aparece en seats es por una declaracion de un dato que se me chispoteo en algun lado pero sigue funcinando igual... o deberia
  // El componente ahora es más un "controlador de UI" que un contenedor de datos.
  return (
    <AsientoBus seats={displaySeats} onSeatSelect={seatSelectHandler} />
  );
}
