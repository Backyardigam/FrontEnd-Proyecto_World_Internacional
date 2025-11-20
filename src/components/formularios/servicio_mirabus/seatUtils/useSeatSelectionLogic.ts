import { useCallback, useMemo } from "react";
import type { Seat } from "./interfaceBus.tsx";
import { getAdjacentSeats } from "./seatFunctions";

interface UseSeatSelectionLogicResult {
  seatAdjacencyMap: Map<string, string[]>;
  areSeatsContiguous: (selectedSeats: Seat[]) => boolean;
  wouldSplitBlock: (seatIdToDeselect: string, currentSelection: Seat[]) => boolean;
}

export function useSeatSelectionLogic(initialSeatsData: Seat[]): UseSeatSelectionLogicResult {

  //Mapa de adyacencias
  const seatAdjacencyMap = useMemo(() => {
    const map = new Map<string, string[]>();
    initialSeatsData.forEach(seat => {
      const neighbors = getAdjacentSeats(seat, initialSeatsData);
      map.set(seat.id, neighbors.map(n => n.id));
    });
    return map;
  }, [initialSeatsData]);


  // REGLA 1: Valida que todos los asientos seleccionados formen un unico bloque
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

      // Filtramos para obtener solo los vecinos que también están en la seleccion actual
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

  // REGLA 2: Valida que al deseleccionar no se parta el bloque en dos
  const wouldSplitBlock = useCallback((seatIdToDeselect: string, currentSelection: Seat[]): boolean => {
    if (currentSelection.length <= 2) {
      return false;
    }
    const remainingSelection = currentSelection.filter(s => s.id !== seatIdToDeselect);
    // Si los asientos restantes no son contiguos, la deseleccion partiría el bloque
    return !areSeatsContiguous(remainingSelection);
  }, [areSeatsContiguous]);

  return { seatAdjacencyMap, areSeatsContiguous, wouldSplitBlock };
}