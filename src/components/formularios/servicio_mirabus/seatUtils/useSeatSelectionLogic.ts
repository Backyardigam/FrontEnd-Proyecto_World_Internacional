import { useCallback, useMemo } from "react";
import type { Seat } from "./interfaceBus.tsx"; // Importar Seat desde interfaceBus.tsx
import { getAdjacentSeats } from "./seatFunctions"; // Importar getAdjacentSeats desde el nuevo archivo

interface UseSeatSelectionLogicResult {
  seatAdjacencyMap: Map<string, string[]>;
  areSeatsContiguous: (selectedSeats: Seat[]) => boolean;
  wouldSplitBlock: (seatIdToDeselect: string, currentSelection: Seat[]) => boolean;
}

export function useSeatSelectionLogic(initialSeatsData: Seat[]): UseSeatSelectionLogicResult {

  // ENFOQUE DE GRAFO: Pre-calculamos el mapa de adyacencias de todo el bus UNA SOLA VEZ.
  const seatAdjacencyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    initialSeatsData.forEach(seat => {
      const neighbors = getAdjacentSeats(seat, initialSeatsData);
      map.set(seat.id, neighbors.map(n => n.id));
    });
    return map;
  }, [initialSeatsData]); // initialSeatsData es estable, por lo que esto solo se ejecuta una vez.


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
      const neighborIds = seatAdjacencyMap.get(current.id) || [];

      // Filtramos para obtener solo los vecinos que también están en la selección actual.
      const neighbors = selectedSeats.filter(s => neighborIds.includes(s.id));

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          queue.push(neighbor);
        }
      }
    }
    return visited.size === selectedSeats.length;
  }, [seatAdjacencyMap]);

  // REGLA 2: Valida que al deseleccionar no se parta el bloque en dos.
  const wouldSplitBlock = useCallback((seatIdToDeselect: string, currentSelection: Seat[]): boolean => {
    if (currentSelection.length <= 2) {
      return false; // No se puede partir un bloque de 2 o menos asientos.
    }
    const remainingSelection = currentSelection.filter(s => s.id !== seatIdToDeselect);
    // Si los asientos restantes no son contiguos, la deselección partiría el bloque.
    return !areSeatsContiguous(remainingSelection);
  }, [areSeatsContiguous]);

  return { seatAdjacencyMap, areSeatsContiguous, wouldSplitBlock };
}