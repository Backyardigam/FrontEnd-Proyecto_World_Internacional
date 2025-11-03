import type { Seat, SeatStatus, Bus } from "./interfaceBus";

/**
 * Nombres de los eventos de Socket.IO.
 */
export enum SocketEvents {
  // --- Eventos del Cliente al Servidor ---
  JOIN_TRIP_ROOM = "client:join_trip_room",
  LEAVE_TRIP_ROOM = "client:leave_trip_room",
  REQUEST_SEAT_SELECTION = "client:request_seat_selection",
  REQUEST_SEAT_DESELECTION = "client:request_seat_deselection",

  // --- Eventos del Servidor al Cliente ---
  INITIAL_SEAT_STATE = "server:initial_seat_state",
  SEAT_STATUS_UPDATED = "server:seat_status_updated",
  SELECTION_FAILED = "server:selection_failed",
  SESSION_EXPIRED = "server:session_expired",
}

// --- Definición de Payloads (Tipos de datos) ---

// Payloads para eventos Cliente -> Servidor
export interface JoinTripRoomPayload {
  userId: string;
  servicio: string;
  fecha: string;
  horario: string;

}

export interface RequestSeatSelectionPayload {
  seatId: string;
  busOrden: string;
}

export interface RequestSeatDeselectionPayload {
  seatId: string;
  busOrden: string;
}

// Payloads para eventos Servidor -> Cliente
export type InitialSeatStatePayload = Bus[];

export interface SeatStatusUpdatedPayload {
  busOrden: string; // <-- AÑADIDO: Para saber en qué bus ocurrió el cambio
  seatId: string;
  newStatus: SeatStatus;
  userId: string; // Para saber quién hizo el cambio
}

export interface SelectionFailedPayload {
  busOrden: string; // <-- AÑADIDO: Para saber en qué bus falló
  seatId: string;
  reason: string;
  currentState: Seat; // El estado actual real del asiento para corregir la UI
}

export interface SessionExpiredPayload {
  reason: string;
}

// Mapa de tipos para usar con un cliente de socket.io tipado
export interface ServerToClientEvents {
  [SocketEvents.INITIAL_SEAT_STATE]: (payload: InitialSeatStatePayload) => void;
  [SocketEvents.SEAT_STATUS_UPDATED]: (
    payload: SeatStatusUpdatedPayload
  ) => void;
  [SocketEvents.SELECTION_FAILED]: (payload: SelectionFailedPayload) => void;
  [SocketEvents.SESSION_EXPIRED]: (payload: SessionExpiredPayload) => void;
}

export interface ClientToServerEvents {
  [SocketEvents.JOIN_TRIP_ROOM]: (payload: JoinTripRoomPayload) => void;
  [SocketEvents.LEAVE_TRIP_ROOM]: () => void;
  [SocketEvents.REQUEST_SEAT_SELECTION]: (
    payload: RequestSeatSelectionPayload
  ) => void;
  [SocketEvents.REQUEST_SEAT_DESELECTION]: (
    payload: RequestSeatDeselectionPayload
  ) => void;
}
