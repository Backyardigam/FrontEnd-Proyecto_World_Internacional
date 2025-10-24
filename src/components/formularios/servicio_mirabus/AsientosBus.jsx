import React, { useState, useEffect, useCallback, useRef } from "react";
import Asiento from "./Asiento";

export default function AsientoBus() {
  // estado de los asientos, formato que se recibe desde el backend

  const initialSeats = [
    // Array de prueba con 30 asientos. Layout: 5 filas (y), 8 columnas (x).
    // Distribución: 2 asientos - pasillo - 2 asientos - pasillo - 2 asientos.
    // Fila 1
    { id: "01", x: 1, y: 1, status: "available" },
    { id: "02", x: 2, y: 1, status: "available" },
    { id: "03", x: 4, y: 1, status: "occupied" },
    { id: "04", x: 5, y: 1, status: "available" },
    { id: "05", x: 7, y: 1, status: "available" },
    { id: "06", x: 8, y: 1, status: "available" },
    // Fila 2
    { id: "07", x: 1, y: 2, status: "available" },
    { id: "08", x: 2, y: 2, status: "occupied" },
    { id: "09", x: 4, y: 2, status: "available" },
    { id: "10", x: 5, y: 2, status: "available" },
    { id: "11", x: 7, y: 2, status: "occupied" },
    { id: "12", x: 8, y: 2, status: "available" },
    // Fila 3
    { id: "13", x: 1, y: 3, status: "selected" },
    { id: "14", x: 2, y: 3, status: "available" },
    { id: "15", x: 4, y: 3, status: "available" },
    { id: "16", x: 5, y: 3, status: "occupied" },
    { id: "17", x: 7, y: 3, status: "available" },
    { id: "18", x: 8, y: 3, status: "available" },
    // Fila 4
    { id: "19", x: 1, y: 4, status: "available" },
    { id: "20", x: 2, y: 4, status: "available" },
    { id: "21", x: 4, y: 4, status: "available" },
    { id: "22", x: 5, y: 4, status: "available" },
    { id: "23", x: 7, y: 4, status: "available" },
    { id: "24", x: 8, y: 4, status: "available" },
    // Fila 5
    { id: "25", x: 1, y: 5, status: "occupied" },
    { id: "26", x: 2, y: 5, status: "occupied" },
    { id: "27", x: 4, y: 5, status: "available" },
    { id: "28", x: 5, y: 5, status: "available" },
    { id: "29", x: 7, y: 5, status: "occupied" },
    { id: "30", x: 8, y: 5, status: "occupied" },
    { id: "29", x: 12, y: 5, status: "occupied" },
  ];

  const [seats, setSeats] = useState(initialSeats); // Estado para los asientos
  const [grid, setGrid] = useState([]); // Estado para la matriz del bus
  const ws = useRef(null); //conexión WebSocket

  useEffect(() => {
    if (seats.length === 0) return;

    // El backend debería proveer maxRows y maxCols, pero los calculamos por si acaso.
    const maxRows = Math.max(...seats.map((s) => s.y));
    const maxCols = Math.max(...seats.map((s) => s.x));

    // 1. Crear una matriz vacía (llena de nulls)
    const newGrid = Array(maxRows)
      .fill(null)
      .map(() => Array(maxCols).fill(null));

    // 2. Poblar la matriz con los asientos en sus coordenadas x, y
    seats.forEach((seat) => {
      // Se resta 1 porque los arrays son base 0, y las coordenadas base 1
      if (seat.y > 0 && seat.x > 0) {
        newGrid[seat.y - 1][seat.x - 1] = seat;
      }
    });

    setGrid(newGrid);
  }, [seats]); // Se ejecuta solo cuando el array de 'seats' cambia

  const handleSeatClick = (id) => {
    console.log("Has seleccionado un asiento:", id);
  };

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
                {row.map((seat, colIndex) => {
                  // Si no hay asiento en esta celda (pasillo), renderiza una celda vacía
                  if (!seat) {
                    return (
                      <td
                        key={`${rowIndex}-${colIndex}`}
                        className="p-2 w-12 h-12"
                      ></td>
                    );
                  }

                  // Lógica de estilos (la misma que ya tenías)
                  let seatClassName = "p-1 m-0 rounded-md";
                  let iconClassName = "w-8 h-8 relative";
                  let ariaLabel = `Asiento ${seat.id}`;
                  let isDisabled = false;

                  switch (seat.status) {
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
                      seatClassName += " bg-red-100 cursor-not-allowed";
                      iconClassName += " text-red-500";
                      ariaLabel += " ocupado";
                      isDisabled = true;
                      break;
                    default:
                      iconClassName += " text-gray-400";
                  }

                  return (
                    <td key={seat.id} className="text-center">
                      <button
                        type="button"
                        onClick={() => handleSeatClick(seat.id)}
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
