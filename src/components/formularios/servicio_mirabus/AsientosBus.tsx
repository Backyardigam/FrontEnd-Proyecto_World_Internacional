import React, { useState, useEffect, useCallback } from "react";
import Asiento from "./Asiento";

// Los tipos se pueden mover a un archivo compartido (ej: types.ts) para ser usados
// tanto aquí como en los componentes padres.
export type SeatStatus =
  | "available"
  | "selected"
  | "occupied"
  | "reserved"
  | "blocked";

export interface Seat {
  id: string;
  x: number;
  y: number;
  status: SeatStatus;
}

interface AsientoBusProps {
  seats: Seat[];
  onSeatSelect: (seatId: string) => void;
}

export default function AsientoBus({ seats, onSeatSelect }: AsientoBusProps) {
  // Este estado local SÍ es necesario para la UI. Contendrá los asientos
  const [grid, setGrid] = useState<(Seat | null)[][]>([]); // Solo necesitamos el estado de la cuadrícula final

  // --- Lógica de selección de asientos ---

  const getAdjacentSeats = useCallback(
    (seat: Seat, allSeats: Seat[]): Seat[] => {
      //Funcion que lista los asientos adyacentes de los seleccionados
      //adyacencia horizontal
      const horizontal = allSeats.filter(
        (s) => s.y === seat.y && Math.abs(s.x - seat.x) === 1
      );

      //adyacencia vertical
      const seatsInSameColumn = allSeats.filter((s) => s.x === seat.x);

      // encuentra el asiento más cercano hacia arriba (menor 'y' mayor que el actual)
      const seatAbove = seatsInSameColumn
        .filter((s) => s.y > seat.y)
        .sort((a, b) => a.y - b.y)[0];

      // encuentra el asiento más cercano hacia abajo (mayor 'y' menor que el actual)
      const seatBelow = seatsInSameColumn
        .filter((s) => s.y < seat.y)
        .sort((a, b) => b.y - a.y)[0];

      const vertical = [];
      if (seatAbove) {
        vertical.push(seatAbove);
      }
      if (seatBelow) {
        vertical.push(seatBelow);
      }

      return [...horizontal, ...vertical];
    },
    []
  );

  // Efecto unificado: se ejecuta cuando los 'seats' de las props cambian.
  // Calcula los estados de UI (bloqueo) y construye la cuadrícula en un solo paso.
  useEffect(() => {
    if (seats.length === 0) {
      setGrid([]);
      return;
    }

    // 1. Calcular los asientos a mostrar con la lógica de bloqueo/disponibilidad
    const selectedSeats = seats.filter((s) => s.status === "selected");
    let finalDisplaySeats: Seat[];

    if (selectedSeats.length === 0) {
      // Si no hay nada seleccionado, todos los asientos 'blocked' vuelven a 'available'.
      finalDisplaySeats = seats.map((s) =>
        s.status === "blocked" ? { ...s, status: "available" } : s
      );
    } else {
      // Si hay seleccionados, calculamos los adyacentes y bloqueamos el resto.
      const allowedSeatIds = new Set(
        selectedSeats
          .flatMap((sel) => getAdjacentSeats(sel, seats))
          .filter((s) => s.status !== "occupied" && s.status !== "reserved")
          .map((s) => s.id)
      );

      finalDisplaySeats = seats.map((s): Seat => {
        if (
          s.status === "occupied" ||
          s.status === "reserved" ||
          s.status === "selected"
        ) {
          return s;
        }
        const newStatus = allowedSeatIds.has(s.id) ? "available" : "blocked";
        return { ...s, status: newStatus };
      });
    }

    // 2. Construir la cuadrícula visual a partir de los asientos calculados.
    const maxRows = Math.max(...finalDisplaySeats.map((s) => s.y));
    const maxCols = Math.max(...finalDisplaySeats.map((s) => s.x));
    const newGrid = Array(maxRows).fill(null).map((): (Seat | null)[] => Array(maxCols).fill(null));
    finalDisplaySeats.forEach((seat) => {
      if (seat.y > 0 && seat.x > 0) newGrid[seat.y - 1][seat.x - 1] = seat;
    });

    setGrid(newGrid);
  }, [seats, getAdjacentSeats]);

  return (
    <>
      <h2 className="col-span-full text-lg font-semibold mb-4">
        Selecciona tu Asiento
      </h2>
      <div className="p-4 border rounded-lg inline-block">
        <table className="border-collapse">
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((seat: Seat | null, colIndex: number) => {
                  // si no hay asiento en esta celda (el pasillo), renderiza una celda vacía
                  if (!seat) {
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className="p-2 w-12 h-12"
                      ></td>
                    );
                  }
                  let seatClassName = "p-1 m-0 rounded-md";
                  let iconClassName = "w-8 h-8 relative";
                  let ariaLabel = `Asiento ${seat.id}`;
                  let isDisabled = false;

                  switch (seat.status) {
                    //no borren el espacio inicial
                    case "available":
                      seatClassName += " hover:bg-gray-200";
                      iconClassName += " text-green-500";
                      ariaLabel += " disponible";
                      break;
                    case "selected":
                      seatClassName += " bg-blue-200 hover:bg-blue-300";
                      iconClassName += " text-blue-700";
                      ariaLabel += " seleccionado por ti";
                      break;
                    case "occupied":
                      seatClassName += " bg-yellow-200 cursor-not-allowed";
                      iconClassName += " text-yellow-700"; //el color del trazo, no pregunten porque se pide con el text, funciona y ya
                      ariaLabel += " ocupado por otra persona";
                      isDisabled = true;
                      break;
                    case "reserved":
                      seatClassName += " bg-red-100 cursor-not-allowed";
                      iconClassName += " text-red-500";
                      ariaLabel += " reservado";
                      isDisabled = true;
                      break;
                    case "blocked":
                      seatClassName += " bg-gray-100 cursor-not-allowed";
                      iconClassName += " text-gray-400";
                      isDisabled = true;
                      break;
                    default:
                      iconClassName += " text-gray-400";
                  }

                  return (
                    <td key={seat.id} className="text-center">
                      <button
                        type="button"
                        onClick={() => onSeatSelect(seat.id)}
                        className={seatClassName}
                        aria-label={ariaLabel}
                        disabled={isDisabled}
                      >
                        <Asiento
                          className={iconClassName}
                          num_asiento={seat.id}
                        />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
