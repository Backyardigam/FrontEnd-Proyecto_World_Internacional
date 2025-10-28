import React, { useState, useEffect } from "react";
import Asiento from "./Asiento";
import type { Seat } from "./seatUtils/interfaceBus";

interface AsientoBusProps {
  seats: Seat[];
  onSeatSelect: (seatId: string) => void;
}

export default function AsientoBus({ seats, onSeatSelect }: AsientoBusProps) {
  // Este estado local SÍ es necesario para la UI. Contendrá los asientos
  const [grid, setGrid] = useState<(Seat | null)[][]>([]); // Solo necesitamos el estado de la cuadrícula final

  // Este efecto ahora solo construye la cuadrícula visual a partir de los asientos que recibe.
  // La lógica de qué asientos están 'bloqueados' ya no vive aquí.
  useEffect(() => {
    if (seats.length === 0) {
      setGrid([]);
      return;
    }

    // Construir la cuadrícula visual a partir de los asientos recibidos en las props.
    const maxRows = Math.max(...seats.map((s) => s.y));
    const maxCols = Math.max(...seats.map((s) => s.x));
    const newGrid = Array(maxRows).fill(null).map((): (Seat | null)[] => Array(maxCols).fill(null));
    seats.forEach((seat) => {
      if (seat.y > 0 && seat.x > 0) newGrid[seat.y - 1][seat.x - 1] = seat;
    });

    setGrid(newGrid);
  }, [seats]);

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
