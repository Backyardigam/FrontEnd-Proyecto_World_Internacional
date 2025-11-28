import { useState, useCallback, useRef, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type {
  Bus,
  Seat,
} from "../components/formularios/servicio_mirabus/seatUtils/interfaceBus";

import {
  type ServerToClientEvents,
  type ClientToServerEvents,
  type JoinTripRoomPayload,
  SocketEvents,
} from "../components/formularios/servicio_mirabus/seatUtils/socketEvents";
/**
 * Define la forma del objeto que devolvera el hook
 * Esto es lo que los componentes consumiran
 */
interface UseSocketTripReturn {
  buses: Bus[];
  isConnected: boolean;
  isConnecting: boolean;
  sessionTimeLeft: number;
  sessionExpired: boolean;
  connectToTrip: (
    tripDetails: JoinTripRoomPayload,
    callback?: (result: { success: boolean; error?: string }) => void
  ) => void;
  disconnectFromTrip: () => void;
  selectSeat: (seatId: string, busOrden: string) => void;
  deselectSeat: (seatId: string, busOrden: string) => void;
}

/**
 * Construye dinámicamente la URL del servidor de Socket.IO.
 * - En producción, siempre usará 'wss://'.
 * - En desarrollo, usará 'ws://' para evitar problemas con certificados SSL locales.
 * @returns La URL completa del socket.
 */
function getSocketUrl(): string {
  const rawUrl = import.meta.env.PUBLIC_SOCKET_URL || "localhost:3001";

  // Determina el protocolo. Usa 'ws' si la URL contiene 'localhost' o si no estamos en producción.
  const isLocal = rawUrl.includes("localhost") || import.meta.env.DEV;
  const protocol = isLocal ? 'ws' : 'wss';

  // Limpia el prefijo http/https/ws/wss por si acaso y construye la URL final.
  return `${protocol}://${rawUrl.replace(/^(https?|wss?):\/\//, '')}`;
}

/**
 * Hook personalizado para gestionar la lógica de selección de asientos
 * de un viaje a través de WebSockets.
 */
export function useSocketTrip(): UseSocketTripReturn {
  // --- ESTADO INTERNO DEL HOOK ---
  const [buses, setBuses] = useState<Bus[]>([]); // Este es ahora el estado principal
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

  // --- LÓGICA DE LIMPIEZA Y DESCONEXIÓN ---
  const cleanup = useCallback(() => {
    // Limpiar el temporizador si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // Desconectar el socket si existe
    socketRef.current?.disconnect();
    socketRef.current = null;

    // Resetear todos los estados a sus valores iniciales
    setIsConnected(false);
    setIsConnecting(false);
    setBuses([]);
    setSessionTimeLeft(0);
    setSessionExpired(false);
  }, []);

  // Efecto para manejar la expiración del temporizador
  useEffect(() => {
    // Solo actúa si el tiempo llega a 0 MIENTRAS estamos conectados.
    if (sessionTimeLeft <= 0 && isConnected) {
      console.warn("La sesión de selección ha expirado por tiempo.");
      setSessionExpired(true);
      cleanup(); // Limpia y desconecta
    }
  }, [sessionTimeLeft, isConnected, cleanup]);

  // --- FUNCIONES EXPUESTAS ---

  /**
   * Inicia la conexión con el servidor de sockets y se une a la sala del viaje.
   * @param tripDetails - Objeto con la fecha y el horario del viaje.
   * @param callback - Función opcional que se ejecuta al conectar o al fallar.
   */
  const connectToTrip = useCallback(
    (tripDetails: JoinTripRoomPayload, callback?: (result: { success: boolean; error?: string }) => void) => {
    // Prevenir múltiples conexiones si ya existe una
    if (socketRef.current) return;

    console.log("Conectando al viaje:", tripDetails);
    setIsConnecting(true);
    setSessionExpired(false);

    const newSocket: Socket<ServerToClientEvents, ClientToServerEvents> =
      io(getSocketUrl(), {
        // Opciones de conexión
        withCredentials:true,
        reconnection: true, // Habilitar la reconexión si se pierde la conexión
        reconnectionAttempts: 3, // Intentar reconectar solo 3 veces
        reconnectionDelay: 1000, // Esperar 1 segundo entre intentos
        autoConnect: false, // ¡IMPORTANTE! No conectar automáticamente al crear la instancia.
        transports: ["websocket"], // Forzar el uso de WebSockets
      });
    socketRef.current = newSocket;

    // --- CONFIGURACIÓN DE LISTENERS (socket.on) ---

    newSocket.on("connect", () => {
      console.log("Socket conectado con ID:", newSocket.id);
      setIsConnected(true);
      setIsConnecting(false);
      newSocket.emit(SocketEvents.JOIN_TRIP_ROOM, tripDetails);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Error de conexión:", err.message);
      callback?.({ success: false, error: `No se pudo conectar al servidor: ${err.message}` });
      cleanup(); // Limpia para permitir un nuevo intento
    });

    newSocket.on("disconnect", () => {
      console.log("Socket desconectado.");
      cleanup();
    });

    newSocket.on(SocketEvents.INITIAL_SEAT_STATE, (initialBuses) => {
      console.log("Recibido estado inicial de buses:", initialBuses);
      setBuses(initialBuses);
      callback?.({ success: true }); // ¡Conexión y unión a la sala exitosas!

      // Iniciar el temporizador de sesión de 5 minutos
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionTimeLeft(300); // 5 minutos = 300 segundos
      timerRef.current = setInterval(() => {
        setSessionTimeLeft((prevTime) => {
          // La lógica de expiración está en el useEffect para mayor limpieza
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    });

    newSocket.on(SocketEvents.SEAT_STATUS_UPDATED, (payload) => {
      console.log("Actualización de asiento recibida:", payload);
      setBuses((currentBuses) =>
        currentBuses.map((bus) =>
          bus.ordenBus === payload.busOrden
            ? {
                ...bus,
                seats: bus.seats.map((seat) =>
                  seat.id === payload.seatId
                    ? { ...seat, status: payload.newStatus, userId: payload.userId }
                    : seat
                ),
              }
            : bus
        )
      );
    });

    newSocket.on(SocketEvents.SELECTION_FAILED, (payload) => {
      console.error("Falló la selección de asiento:", payload);
      // El servidor nos dice que nuestra acción falló y nos envía el estado real del asiento.
      // Usamos esta información para corregir nuestra UI.
      setBuses((currentBuses) =>
        currentBuses.map((bus) =>
          bus.ordenBus === payload.busOrden
            ? {
                ...bus,
                seats: bus.seats.map((seat) =>
                  seat.id === payload.seatId
                    ? { ...payload.currentState } // Revertimos al estado que dice el servidor
                    : seat
                ),
              }
            : bus
        )
      );
    });

    newSocket.on(SocketEvents.SESSION_EXPIRED, (payload) => {
      console.warn("La sesión de selección ha expirado:", payload.reason);
      setSessionExpired(true);
      cleanup(); // Limpia y desconecta
    });

    // Ahora que todo está configurado, conectamos manualmente.
    newSocket.connect();
  }, [cleanup, isConnected]);

  /**
   * Cierra la conexión con el servidor de sockets y limpia el estado.
   */
  const disconnectFromTrip = useCallback(() => {
    console.log("Desconectando del viaje.");
    cleanup();
  }, []);

  /**
   * Envía una petición al servidor para seleccionar un asiento.
   * @param seatId - El ID del asiento a seleccionar.
   * @param busOrden - El identificador del bus donde está el asiento.
   */
  const selectSeat = useCallback((seatId: string, busOrden: string) => {
    console.log(
      `Solicitando seleccionar asiento: ${seatId} en bus ${busOrden}`
    );
    socketRef.current?.emit(SocketEvents.REQUEST_SEAT_SELECTION, {
      seatId,
      busOrden,
    });
  }, []);

  /**
   * Envía una petición al servidor para deseleccionar un asiento.
   * @param seatId - El ID del asiento a deseleccionar.
   * @param busOrden - El identificador del bus donde está el asiento.
   */
  const deselectSeat = useCallback((seatId: string, busOrden: string) => {
    console.log(
      `Solicitando deseleccionar asiento: ${seatId} en bus ${busOrden}`
    );
    socketRef.current?.emit(SocketEvents.REQUEST_SEAT_DESELECTION, {
      seatId,
      busOrden,
    });
  }, []);

  // El hook devuelve el estado actual y las funciones para que los componentes interactúen.
  return {
    buses, // Devuelve el array de buses
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
