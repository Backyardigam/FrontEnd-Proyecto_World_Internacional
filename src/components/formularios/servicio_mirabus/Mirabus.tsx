import React, { useState, useCallback, useMemo } from "react";
import AsientoBus from "./AsientosBus";
import type { Seat, SeatStatus } from "./seatUtils/interfaceBus"; // Importar desde el archivo compartido
import { useSeatSelectionLogic } from "./seatUtils/useSeatSelectionLogic"; // Importar el hook de lógica
import { getAdjacentSeats } from "./seatUtils/seatFunctions"; // Importar la función de utilidad pura

export default function Mirabus() {
  // Datos iniciales de los asientos.
  const initialSeatsData: Seat[] = [
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
    //{ id: "23", x: 5, y: 4, status: "available" },
    { id: "24", x: 6, y: 4, status: "available" },
    { id: "25", x: 7, y: 4, status: "available" },
    { id: "26", x: 8, y: 4, status: "available" },
    { id: "27", x: 9, y: 4, status: "available" },
    // Fila 4
    { id: "28", x: 1, y: 5, status: "available" },
    { id: "29", x: 2, y: 5, status: "available" },
    { id: "30", x: 3, y: 5, status: "available" },
    //{ id: "31", x: 4, y: 5, status: "available" },
    { id: "32", x: 5, y: 5, status: "available" },
    { id: "33", x: 6, y: 5, status: "available" },
    { id: "34", x: 7, y: 5, status: "available" },
    { id: "35", x: 8, y: 5, status: "available" },
    { id: "36", x: 9, y: 5, status: "available" },
  ];

  // Usamos useState para que React pueda re-renderizar el componente cuando los asientos cambien.
  const [seats, setSeats] = useState<Seat[]>(initialSeatsData);

  // usamos el nuevo hook para encapsular la lógica de selección de asientos
  const { areSeatsContiguous, wouldSplitBlock } =
    useSeatSelectionLogic(initialSeatsData);

  // funcion que maneja el click en un asiento
  const seatSelectHandler = useCallback(
    (seatId: string) => {
      setSeats((currentSeats) => {
        // la logica de validacion se aplica aqui para usar siempre el estado más reciente
        console.log("Intentando seleccionar:", seatId);
        const seatToToggle = currentSeats.find((s) => s.id === seatId);
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
          // Al seleccionar, solo verificamos que el nuevo bloque sea contiguo.
          if (!areSeatsContiguous(newSelection)) {
            console.warn(
              `Acción bloqueada: La selección debe formar un único bloque.`
            );
            return currentSeats;
          }
        } else {
          // Al deseleccionar, verificamos si la acción parte el bloque.
          const currentSelection = currentSeats.filter(
            (s) => s.status === "selected"
          );
          if (wouldSplitBlock(seatId, currentSelection)) {
            console.warn(
              `Acción bloqueada: No se puede deseleccionar un asiento que parte el bloque.`
            );
            return currentSeats;
          }
        }

        // 3. Si es válida, aplicar el cambio.
        return hypotheticalSeats;
      });
    },
    [areSeatsContiguous, wouldSplitBlock]
  );


  // logica de UI para determinar qué asientos mostrar (incluyendo los bloqueados)
  // se calcula cada vez que el estado 'seats' cambia
  const displaySeats = useMemo(() => {
    const selectedSeats = seats.filter((s) => s.status === "selected");

    if (selectedSeats.length === 0) {
      // si no hay nada seleccionado, todos los asientos 'blocked' vuelven a 'available'
      return seats.map((s) =>
        s.status === "blocked" ? { ...s, status: "available" } : s
      );
    }

    // formamos la lista de permitidos excluyendo preterderminadamente los ocupados o reservados
    const allowedSeatIds = new Set(
      selectedSeats
        .flatMap((sel) => getAdjacentSeats(sel, seats))
        .filter((s) => s.status !== "occupied" && s.status !== "reserved")
        .map((s) => s.id)
    );

    return seats.map((s): Seat => {
      if (
        s.status === "occupied" ||
        s.status === "reserved" ||
        s.status === "selected"
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
  return (
    <>
      <AsientoBus seats={displaySeats} onSeatSelect={seatSelectHandler} />
    </>
  );
}
