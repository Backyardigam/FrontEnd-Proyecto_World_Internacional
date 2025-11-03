import { useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { Seat } from "../components/formularios/servicio_mirabus/seatUtils/interfaceBus";

// Importar nuestro contrato de eventos y tipos
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  JoinTripRoomPayload,
  SocketEvents
} from "../components/formularios/servicio_mirabus/seatUtils/socketEvents";

/**
 * Define la forma del objeto que devolverá el hook.
 * Esto es lo que los componentes consumirán.
 */
interface UseSocketTripReturn {
  seats: Seat[];
  isConnected: boolean;
  isConnecting: boolean;
  sessionTimeLeft: number;
  sessionExpired: boolean;
  connectToTrip: (tripDetails: JoinTripRoomPayload) => void;
  disconnectFromTrip: () => void;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
}

// La URL del servidor de Socket.IO. En un proyecto real, esto debería
// venir de una variable de entorno.
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:3001";

/**
 * Hook personalizado para gestionar la lógica de selección de asientos
 * de un viaje a través de WebSockets.
 */
export function useSocketTrip(): UseSocketTripReturn {
  // --- ESTADO INTERNO DEL HOOK ---
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Usamos useRef para mantener la instancia del socket y el temporizador
  // sin causar re-renders innecesarios cuando cambian.
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- FUNCIONES EXPUESTAS ---

  /**
   * Inicia la conexión con el servidor de sockets y se une a la sala del viaje.
   * @param tripDetails - Objeto con la fecha y el horario del viaje.
   */
  const connectToTrip = useCallback((tripDetails: JoinTripRoomPayload) => {
    // Lógica para crear el socket, configurar los listeners (socket.on)
    // y emitir el evento 'join_trip_room'. Se implementará después.
    console.log("Conectando al viaje:", tripDetails);
  }, []);

  /**
   * Cierra la conexión con el servidor de sockets y limpia el estado.
   */
  const disconnectFromTrip = useCallback(() => {
    // Lógica para desconectar el socket, limpiar el temporizador y
    // resetear los estados. Se implementará después.
    console.log("Desconectando del viaje.");
  }, []);

  /**
   * Envía una petición al servidor para seleccionar un asiento.
   * @param seatId - El ID del asiento a seleccionar.
   */
  const selectSeat = useCallback((seatId: string) => {
    // Lógica para emitir 'request_seat_selection'. Se implementará después.
    console.log("Solicitando seleccionar asiento:", seatId);
  }, []);

  /**
   * Envía una petición al servidor para deseleccionar un asiento.
   * @param seatId - El ID del asiento a deseleccionar.
   */
  const deselectSeat = useCallback((seatId: string) => {
    // Lógica para emitir 'request_seat_deselection'. Se implementará después.
    console.log("Solicitando deseleccionar asiento:", seatId);
  }, []);

  // El hook devuelve el estado actual y las funciones para que los componentes interactúen.
  return {
    seats,
    isConnected,
    isConnecting,
    sessionTimeLeft,
    sessionExpired,
    connectToTrip,
    disconnectFromTrip,
    selectSeat,
    deselectSeat,
  };
}
