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
  type AdminToggleSeatPayload,
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
  initiatePayment: (
    orderId: string,
    callback: (response: { success: boolean; error?: string }) => void
  ) => void;
  adminToggleSeat: (seatId: string, busOrden: string) => void; // <-- Nueva función
  stopSessionTimer: () => void;
  resumeSessionTimer: () => void;
}

// La URL del servidor de Socket.IO. En un proyecto real, esto debería
// venir de una variable de entorno.
const SOCKET_URL = import.meta.env.PUBLIC_SOCKET_URL || "http://localhost:3001";

/**
 * Hook personalizado para gestionar la lógica de selección de asientos
 * de un viaje a través de WebSockets.
 */
export function useSocketTrip(): UseSocketTripReturn {
  // --- ESTADO INTERNO DEL HOOK ---
  const [buses, setBuses] = useState<Bus[]>([]);
  
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

  // Guardamos el valor inicial del temporizador para una comprobación más robusta.
  const initialSessionTime = 300;

  // Efecto para manejar la expiración del temporizador
  useEffect(() => {
    // Solo actúa si el tiempo llega a 0 MIENTRAS estamos conectados Y el temporizador ya había sido iniciado.
    // Esto previene que se dispare al conectar, cuando sessionTimeLeft es 0 inicialmente.
    if (sessionTimeLeft <= 0 && isConnected && timerRef.current) {
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
      io(SOCKET_URL, {
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
      // Emitimos el evento y esperamos una confirmación (acknowledgment) del servidor.
      newSocket.emit(
        SocketEvents.JOIN_TRIP_ROOM,
        tripDetails,
        (response) => {
          console.log("Respuesta del servidor a JOIN_TRIP_ROOM:", response);
          if (response.success) {
            callback?.({ success: true }); // ¡Unión a la sala exitosa!
          } else {
            callback?.({ success: false, error: response.error || "No se pudo unir a la sala." });
          }
        }
      );
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

      // Iniciar el temporizador de sesión de 5 minutos
      if (timerRef.current) clearInterval(timerRef.current);
      setSessionTimeLeft(initialSessionTime); // 5 minutos = 300 segundos
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
                    ? { ...seat, status: payload.newStatus}
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
  }, [cleanup, isConnecting]); // Cambiamos isConnected por isConnecting para la guarda del inicio

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

  /**
   * Notifica al servidor que el usuario está iniciando el proceso de pago.
   * El servidor debería bloquear los asientos seleccionados por este usuario.
   * @param callback - Función que se ejecuta con la respuesta del servidor.
   */
  const initiatePayment = useCallback(
    (orderId: string, callback: (response: { success: boolean; error?: string }) => void) => {
      console.log(`[Socket] Notificando pago exitoso para orden ${orderId}`);
      socketRef.current?.emit(SocketEvents.INITIATE_PAYMENT, { orderId });
      // Como el backend no responde con un callback, asumimos que se envió y continuamos el flujo.
      callback({ success: true });
    },
    []
  );
  /**
   * Envía una petición de administrador para forzar el cambio de estado de un asiento.
   * @param seatId - El ID del asiento a modificar.
   * @param busOrden - El identificador del bus donde está el asiento.
   */
  const adminToggleSeat = useCallback((seatId: string, busOrden: string) => {
    console.log(
      `[ADMIN] Solicitando toggle para asiento: ${seatId} en bus ${busOrden}`
    );
    socketRef.current?.emit(SocketEvents.ADMIN_TOGGLE_SEAT, {
      seatId,
      busOrden,
    });
  }, []);

  /**
   * Detiene el temporizador de sesión localmente.
   * Útil cuando el usuario está en proceso de pago y no queremos que la sesión expire visualmente.
   */
  const stopSessionTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Reanuda el temporizador de sesión si fue detenido (por ejemplo, al cancelar un pago).
   */
  const resumeSessionTimer = useCallback(() => {
    // Solo reanudamos si no hay un timer activo y queda tiempo
    if (!timerRef.current && sessionTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setSessionTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  }, [sessionTimeLeft]);

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
    initiatePayment,
    adminToggleSeat,
    stopSessionTimer,
    resumeSessionTimer,
  };
}
