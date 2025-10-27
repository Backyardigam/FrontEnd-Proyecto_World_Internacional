import React, { useState, useCallback } from "react";
import AsientoBus from "./AsientosBus";
import type { Seat, SeatStatus } from "./AsientosBus";
//componente encargado de preparar la conexion a ws
export default function Mirabus(){
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

    // Usamos useState para que React pueda re-renderizar el componente cuando los asientos cambien.
    const [seats, setSeats] = useState<Seat[]>(initialSeatsData);

    // --- Lógica de validación de contigüidad ---

    // Función auxiliar para obtener adyacentes, permitiendo cruzar pasillos.
    const getAdjacentSeats = useCallback((seat: Seat, allSeats: Seat[]): Seat[] => {
        const horizontal = allSeats.filter(
            s => s.y === seat.y && Math.abs(s.x - seat.x) === 1
        );

        const seatsInSameColumn = allSeats.filter(s => s.x === seat.x);

        const seatAbove = seatsInSameColumn
            .filter(s => s.y > seat.y)
            .sort((a, b) => a.y - b.y)[0];

        const seatBelow = seatsInSameColumn
            .filter(s => s.y < seat.y)
            .sort((a, b) => b.y - a.y)[0];

        const vertical = [];
        if (seatAbove) vertical.push(seatAbove);
        if (seatBelow) vertical.push(seatBelow);

        return [...horizontal, ...vertical];
    }, []);

    // REGLA 1: Valida que todos los asientos seleccionados formen un único bloque.
    const areSeatsContiguous = useCallback((selectedSeats: Seat[]): boolean => {
        if (selectedSeats.length <= 1) {
            return true;
        }

        const visited = new Set<string>();
        const queue: Seat[] = [selectedSeats[0]];
        visited.add(selectedSeats[0].id);

        while (queue.length > 0) {
            const current = queue.shift()!;
            const neighbors = getAdjacentSeats(current, selectedSeats);

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    queue.push(neighbor);
                }
            }
        }
        return visited.size === selectedSeats.length;
    }, [getAdjacentSeats]);

    // Esta función ahora maneja la lógica para actualizar el estado de los asientos.
    const seatSelectHandler = useCallback((seatId: string) => {
        console.log("Intentando seleccionar:", seatId);

        setSeats(currentSeats => {
            const seatToToggle = currentSeats.find(s => s.id === seatId);
            if (!seatToToggle) return currentSeats;

            const isSelecting = seatToToggle.status !== 'selected';

            // 1. Crear un estado hipotético con el asiento añadido o quitado.
            const hypotheticalSeats = currentSeats.map(seat => {
                if (seat.id === seatId) {
                    const newStatus = isSelecting ? 'selected' : 'available';
                    return { ...seat, status: newStatus as SeatStatus };
                }
                return seat;
            });

            // 2. Validar si el estado hipotético es un rectángulo.
            const newSelection = hypotheticalSeats.filter(s => s.status === 'selected');

            // Aplicar Regla 1: Contigüidad
            if (!areSeatsContiguous(newSelection)) {
                console.warn(`Acción bloqueada: La selección debe formar un único bloque.`);
                return currentSeats; // La acción no es válida, se revierte.
            }

            // 3. Si es válida, aplicar el cambio.
            return hypotheticalSeats;
        });
    }, [areSeatsContiguous]);

    // El JSX debe estar en la misma línea que 'return' o envuelto en paréntesis.
    return (
        <>
            <AsientoBus seats={seats} onSeatSelect={seatSelectHandler}/>
        </>
    );
}