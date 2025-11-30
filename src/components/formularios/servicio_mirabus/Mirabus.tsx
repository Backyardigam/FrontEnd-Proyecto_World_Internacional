import React, { useState, useCallback, useMemo } from "react";
import AsientoBus from "./AsientosBus";
import type { Seat, SeatStatus } from "./seatUtils/interfaceBus";
import { useSeatSelectionLogic } from "./seatUtils/useSeatSelectionLogic";
import { getAdjacentSeats } from "./seatUtils/seatFunctions";

interface MirabusProps {
  initialSeatsData: Seat[];
  busOrden: string;
  mode?: 'customer' | 'admin'; // Modo de operación
  onSelectionChange?: (selectedSeats: Seat[]) => void; // Opcional para admin
  // Callbacks para modo cliente
  onRequestSeatSelection?: (seatId: string, busOrden: string) => void;
  onRequestSeatDeselection?: (seatId: string, busOrden: string) => void;
  // Callback para modo admin
  onAdminSeatToggle?: (seatId: string, busOrden: string) => void;
}

export default function Mirabus({
  initialSeatsData,
  busOrden,
  mode = 'customer', // Por defecto, opera en modo cliente
  onSelectionChange,
  onRequestSeatSelection,
  onRequestSeatDeselection,
  onAdminSeatToggle,
}: MirabusProps) {
  // usamos useState para que React pueda re-renderizar el componente cuando los asientos cambien
  const [seats, setSeats] = useState<Seat[]>(initialSeatsData);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  // Efecto 1: Sincroniza el estado local con los datos del servidor (fusión inteligente y pesimista).
  React.useEffect(() => { 
    // FUSIÓN INTELIGENTE: No reemplazamos el estado, lo fusionamos.
    setSeats(currentLocalSeats => {
      // Identificamos qué asientos *nosotros* hemos puesto en 'pending'
      // para distinguirlos de los 'pending' que vienen del servidor (de otros usuarios).
      const ourPendingRequests = new Set<string>();
      currentLocalSeats.forEach(seat => {
        if (seat.status === 'pending') {
          ourPendingRequests.add(seat.id);
        }
      });

      // Creamos el nuevo estado fusionado.
      const newMergedSeats = initialSeatsData.map(serverSeat => {
        // Si el servidor ya ha confirmado nuestra selección (serverSeat.status === 'selected')
        // o si el asiento está ocupado/reservado/bloqueado (por nosotros o por otros),
        // o si otro usuario lo tiene en 'pending', el estado del servidor es la verdad.
        // En estos casos, el estado del servidor tiene prioridad absoluta.
        if (
          serverSeat.status === 'selected' ||
          serverSeat.status === 'occupied' ||
          serverSeat.status === 'reserved' ||
          serverSeat.status === 'blocked' ||
          // Si el servidor dice 'pending', es porque otro usuario lo tiene en pending.
          // Nuestro 'pending' local solo es válido si el servidor aún lo ve como 'available'.
          (serverSeat.status === 'pending' && !ourPendingRequests.has(serverSeat.id))
        ) {
          return serverSeat;
        }

        // Si el servidor dice 'available', pero nosotros tenemos una petición 'pending' para este asiento,
        // mantenemos nuestro estado 'pending' local hasta que el servidor responda.
        if (serverSeat.status === 'available' && ourPendingRequests.has(serverSeat.id)) {
          const valid:SeatStatus='pending'
          return { ...serverSeat, status: valid };
        }

        // En cualquier otro caso (ej: el servidor ahora dice 'occupied'), el estado del servidor gana.
        return serverSeat;
      });

      return newMergedSeats;
    });
  }, [initialSeatsData]);

  // Efecto 2: Notifica al componente padre cuando la selección local ha cambiado.
  // Esto se ejecuta DESPUÉS de que el estado 'seats' se ha actualizado y el componente se ha renderizado.
  React.useEffect(() => {
    if (onSelectionChange) {
      const currentSelection = seats.filter(s => s.status === 'selected');
      onSelectionChange(currentSelection);
    }
  }, [seats, onSelectionChange]);
  
  // Efecto 3: Limpia el mensaje de advertencia después de un tiempo.
  React.useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage(null);
      }, 3000); // El mensaje desaparecerá después de 3 segundos
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  //  cargar las herramientas necesarias con las funciones
  const { areSeatsContiguous, wouldSplitBlock } =
    useSeatSelectionLogic(initialSeatsData);

  // funcion que maneja el click en un asiento
  const seatSelectHandler = useCallback(
    (seatId: string) => {
      // 1. Encontrar el asiento en el estado local actual
      const seatToToggle = seats.find(s => s.id === seatId);
      if (!seatToToggle) return;

      // Lógica para el modo Administrador
      if (mode === 'admin') {
        // El admin solo puede hacer toggle en asientos disponibles.
        // No puede tocar asientos ya ocupados, reservados o en proceso por un cliente.
        if (seatToToggle.status === 'available') {
          onAdminSeatToggle?.(seatId, busOrden);
        } else {
          setWarningMessage(`Este asiento no está disponible para modificar.`);
        }
        return;
      }

      // Lógica para el modo Cliente (la original)
      if (['occupied', 'reserved', 'blocked', 'pending'].includes(seatToToggle.status)) {
        setWarningMessage(`El asiento ${seatId} no está disponible en este momento.`);
        return;
      }

      const isSelecting = seatToToggle.status !== "selected";

      // 2. Validaciones locales de cliente ANTES de enviar la petición
      if (isSelecting) {
        const currentSelectionCount = seats.filter(s => s.status === 'selected').length;
        const MAX_SELECTION_LIMIT = 10;

        if (onRequestSeatSelection && currentSelectionCount >= MAX_SELECTION_LIMIT) {
          setWarningMessage(`No se pueden seleccionar más de ${MAX_SELECTION_LIMIT} asientos.`);
          return;
        }
        const hypotheticalSelection = [...seats.filter(s => s.status === 'selected'), seatToToggle];
        if (onRequestSeatSelection && !areSeatsContiguous(hypotheticalSelection)) {
          setWarningMessage(`La selección debe formar un único bloque de asientos.`);
          return;
        }
      } else { // Deseleccionando
        const currentSelection = seats.filter(s => s.status === 'selected');
        if (onRequestSeatDeselection && wouldSplitBlock(seatId, currentSelection)) {
          setWarningMessage(`No se puede deseleccionar un asiento que divida el bloque.`);
          return;
        }
      }

      // 3. Si las validaciones locales pasan, actualiza la UI a 'pending' y notifica al padre.
      if (isSelecting && onRequestSeatSelection) {
        setSeats(currentSeats => currentSeats.map(s => 
          s.id === seatId ? { ...s, status: 'pending' } : s
        ));
        // Ahora pasamos el ID del bus junto con el del asiento
        onRequestSeatSelection(seatId, busOrden);
      } else if (!isSelecting && onRequestSeatDeselection) {
        // Para deseleccionar, también podríamos tener un estado 'pending_deselection'
        // pero por simplicidad, llamamos directamente a la acción.
        onRequestSeatDeselection(seatId, busOrden);
      }
    },
    [
      mode,
      seats,
      busOrden,
      areSeatsContiguous,
      wouldSplitBlock,
      onRequestSeatSelection,
      onRequestSeatDeselection,
    ]
  );


  // logica de UI para determinar qué asientos mostrar (incluyendo los bloqueados)
  // se calcula cada vez que el estado 'seats' cambia
  const displaySeats = useMemo(() => {
    // En modo admin, no aplicamos ninguna lógica de bloqueo visual.
    // Simplemente mostramos el estado real de los asientos.
    if (mode === 'admin') {
      return seats;
    }

    // La lógica de bloqueo ahora se basa en el estado local 'seats', que ya está fusionado.
    const hasPendingSeats = seats.some(s => s.status === 'pending');
    const selectedSeats = seats.filter((s) => s.status === "selected");

    // Si hay asientos en estado 'pending' (nuestros), bloqueamos todos los demás 'available'
    // para evitar selecciones rápidas adicionales y posibles inconsistencias.
    if (hasPendingSeats) {
      return seats.map(s => {
        if (s.status === 'available' && !selectedSeats.some(sel => sel.id === s.id)) {
          const block:SeatStatus='blocked'
          return { ...s, status: block };
        }
        return s;
      });
    }
    const valid:SeatStatus='available';
    // Si no hay asientos seleccionados (y tampoco pending), revertir 'blocked' a 'available'
    if (selectedSeats.length === 0) {
      return seats.map((s) =>
        
        s.status === 'blocked' ? { ...s, status: valid } : s
      );
    }

    // Si hay asientos seleccionados (y no pending), aplicar reglas de contigüidad.
    const allowedSeatIds = new Set(
      selectedSeats
        .flatMap((sel) => getAdjacentSeats(sel, seats))
        .filter((s) => s.status === "available") // Solo los disponibles son adyacentes válidos
        .map((s) => s.id)
    );

    return seats.map((s): Seat => {
      if (
        s.status === "occupied" ||
        s.status === "reserved" ||
        s.status === "selected" ||
        s.status === "pending" // Los asientos 'pending' (de otros usuarios) también deben mantener su estado
      ) {
        return s;
      }

      // si el asiento no está en la lista de permitidos se bloquea      
      const newStatus:SeatStatus= allowedSeatIds.has(s.id)
        ? 'available'
        : 'blocked';
      return { ...s, status: newStatus };
    });
  }, [seats, mode]);

  return (
    <div>
      {warningMessage && (
        <div className="p-2 mb-4 text-center text-sm text-red-700 bg-red-100 rounded-lg">
          {warningMessage}
        </div>
      )}
      <AsientoBus seats={displaySeats} onSeatSelect={seatSelectHandler} />
    </div>
  );
}
