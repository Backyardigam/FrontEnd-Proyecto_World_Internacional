import type { Seat } from "./interfaceBus"; // Importamos el tipo Seat desde el archivo de interfaces

/**
 * Función pura para obtener los asientos adyacentes a un asiento dado.
 * Considera adyacencia horizontal y vertical.
 * @param seat El asiento para el cual buscar adyacentes.
 * @param allSeats Todos los asientos disponibles en el bus.
 * @returns Un array de asientos adyacentes.
 */
export const getAdjacentSeats = (seat: Seat, allSeats: Seat[]): Seat[] => {
  const horizontal = allSeats.filter(
    (s) => s.y === seat.y && Math.abs(s.x - seat.x) === 1
  );

  const seatsInSameColumn = allSeats.filter((s) => s.x === seat.x);

  const seatAbove = seatsInSameColumn.filter((s) => s.y > seat.y).sort((a, b) => a.y - b.y)[0];
  const seatBelow = seatsInSameColumn.filter((s) => s.y < seat.y).sort((a, b) => b.y - a.y)[0];

  const vertical = [];
  if (seatAbove) vertical.push(seatAbove);
  if (seatBelow) vertical.push(seatBelow);

  return [...horizontal, ...vertical];
};
