import React, { useState, useCallback, StrictMode, useEffect } from "react";
import { FechaHorarioSelector } from "./FechaHorarioSelector";
import Mirabus from "./Mirabus";
import type { Bus, Seat } from "./seatUtils/interfaceBus";
import Formulario, { type PassengerFormData } from "./Formulario"; // Importar el nuevo componente y su interfaz
import { useAuth } from "../../../utils/authContext";
import { apiPost } from "../../../utils/apiClient";
import { useSocketTrip } from "../../../hooks/useSocketTrip";

//Manejar la llamada de datos desde una ruta API

const fetchHorariosDisponibles = async (fecha: string): Promise<string[]> => {
  console.log(`Buscando horarios para ${fecha}`);
  // Simula una llamada a la API para obtener horarios
  await new Promise((resolve) => setTimeout(resolve, 300));
  return ["10:00 AM", "02:00 PM", "06:00 PM"];
};

// simular la obtención de detalles del servicio desde una API ---
const fetchServiceDetails = async (
  serviceId: string
): Promise<{ name: string; price: number }> => {
  console.log(`Fetching details for service: ${serviceId}`);
  await new Promise((resolve) => setTimeout(resolve, 700)); // Simular latencia de red

  if (serviceId === "mirabus-tour-lima") {
    return { name: "Mirabus City Tour Lima", price: 50.0 };
  } else if (serviceId === "tour-fallido") {
    throw new Error("El servicio solicitado no se encuentra disponible.");
  } else {
    throw new Error("Servicio no encontrado.");
  }
};

//componente encargado de cargar con todo el formulario normal y la seleccion de asientos
export default function FormularioMirabus() {
  // --- ESTADOS PARA LA CARGA INICIAL DEL SERVICIO ---
  const [serviceInfo, setServiceInfo] = useState<{
    name: string;
    price: number;
  } | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // --- OBTENER DATOS DEL USUARIO ---
  const { auth, renderWhenReady } = useAuth();

  // --- EFECTO PARA CARGAR LOS DATOS DEL SERVICIO AL MONTAR EL COMPONENTE ---
  const loadServiceData = useCallback(async () => {
    // TODO: En una app real, obtendrías el serviceId desde el router (ej: useParams de React Router)
    const serviceId = "mirabus-tour-lima"; // Simulacion

    setServiceLoading(true);
    setServiceError(null);

    try {
      const data = await fetchServiceDetails(serviceId);
      setServiceInfo(data);
    } catch (error: any) {
      setServiceError(
        error.message || "No se pudo cargar la información del servicio."
      );
    } finally {
      setServiceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServiceData();
  }, [loadServiceData]);

  // Estado para la UI: ¿estamos en modo selección?
  const [isSelecting, setIsSelecting] = useState(false);
  // Nuevo estado para gestionar el cuadro de estado de la conexión
  const [uiStatus, setUiStatus] = useState<{
    status: "idle" | "connecting" | "error";
    message?: string;
  }>({ status: "idle" });

  // Estado para el viaje seleccionado (fecha y hora)
  const [tripSelection, setTripSelection] = useState<{
    fecha: string;
    horario: string;
  } | null>(null);
  // Estado para el bus seleccionado en el <select>
  const [selectedBusOrden, setSelectedBusOrden] = useState<string | null>(null);

  // Estado para almacenar los datos del pasajero recibidos del componente Formulario
  const [passengerData, setPassengerData] = useState<PassengerFormData | null>(
    null
  );

  // El hook que maneja toda la lógica de sockets
  const {
    buses,
    isConnected,
    isConnecting,
    sessionTimeLeft,
    sessionExpired,
    connectToTrip,
    disconnectFromTrip,
    selectSeat,
    deselectSeat,
  } = useSocketTrip();

  // Estado local para guardar los asientos que el usuario ha seleccionado
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Estado para la carga de la reserva y errores
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);

  const handleTripSelection = useCallback(
    async (fecha: string, horario: string) => {
      disconnectFromTrip(); // <-- ¡AQUÍ ESTÁ LA SOLUCIÓN!
      setTripSelection({ fecha, horario });
      setIsSelecting(false); // Volver al estado inicial si se cambia la fecha/hora
      setUiStatus({ status: "idle" }); // Resetear el cuadro de estado
      setSelectedBusOrden(null);
      setReservationError(null); // Limpiar cualquier error de reserva anterior
    },
    [disconnectFromTrip]
  );

  const handleStartSelection = () => {
    if (tripSelection) {
      // if (!auth.isAuthenticated) {
      //   // Redirigir a la página de login, guardando la URL actual para poder volver.
      //   const currentPath = window.location.pathname;
      //   window.location.href = `/login?redirect=${encodeURIComponent(
      //     currentPath
      //   )}`;
      //   return;
      // }

      const servicio = serviceInfo?.name || "";

      setUiStatus({ status: "connecting", message: "Conectando..." });
      setReservationError(null); // Limpiar cualquier error de reserva anterior

      // Llamamos a connectToTrip. El backend identificará al usuario por su cookie.
      connectToTrip({ ...tripSelection, servicio }, (result) => {
        if (result.success) {
          // Solo cambiamos la UI si la conexión fue exitosa.
          setIsSelecting(true);
          setUiStatus({ status: "idle" }); // Ocultamos el cuadro al tener éxito
        } else {
          // Si falla, mostramos el error y el botón de reintento.
          setUiStatus({ status: "error", message: result.error });
        }
      });
    }
  };

  // Buscamos el bus seleccionado para pasarlo al componente Mirabus
  const busToDisplay = buses.find((b) => b.ordenBus === selectedBusOrden);

  // Efecto para seleccionar el primer bus por defecto cuando la lista de buses se carga.
  useEffect(() => {
    if (buses.length > 0 && !selectedBusOrden) {
      setSelectedBusOrden(buses[0].ordenBus);
    }
  }, [buses, selectedBusOrden]);

  // Formatear el tiempo restante para mostrarlo como MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // --- NUEVA FUNCIÓN: Manejar la reserva ---
  const handleReservation = useCallback(async () => {
    setReservationLoading(true);
    setReservationError(null);

    // <-- 4. VALIDACIÓN DE SESIÓN ANTES DE RESERVAR -->
    if (!auth.isAuthenticated) {
      setReservationError(
        "Tu sesión ha expirado o no has iniciado sesión. Por favor, inicia sesión para continuar."
      );
      setReservationLoading(false);
      return;
    }
    // Validaciones básicas
    if (!tripSelection) {
      setReservationError(
        "Por favor, selecciona una fecha y horario para el viaje."
      );
      setReservationLoading(false);
      return;
    }
    if (
      !passengerData ||
      !passengerData.nombreCompleto ||
      !passengerData.dni ||
      !passengerData.celular ||
      !passengerData.correo
    ) {
      setReservationError("Por favor, completa todos tus datos personales.");
      setReservationLoading(false);
      return;
    }
    if (selectedSeats.length === 0) {
      setReservationError("Por favor, selecciona al menos un asiento.");
      setReservationLoading(false);
      return;
    }

    // Construir el payload para la reserva
    const reservationPayload = {
      tripDetails: tripSelection,
      passengerDetails: passengerData,
      // Mapeamos los asientos seleccionados para enviar solo la información relevante
      selectedSeats: selectedSeats.map((seat) => ({
        id: seat.id,
        busOrden: busToDisplay?.ordenBus || "",
      })),
      servicio: serviceInfo?.name || "MIRABUS", // Usar el nombre del servicio cargado
    };

    console.log("Enviando reserva:", reservationPayload);

    try {
      // 2. Usamos apiPost. Le pasamos la URL y el objeto payload directamente.
      // La función se encarga de stringify, headers, credentials, y parsear la respuesta.
      // También lanzará un error si la respuesta no es 'ok'.
      const responseData = await apiPost<{ redirectUrl?: string }>(
        "/api/reserve-trip",
        reservationPayload
      );
      console.log("Reserva exitosa:", responseData);

      // Asumiendo que el backend envía una URL de redirección a Izipay
      if (responseData.redirectUrl) {
        window.location.href = responseData.redirectUrl; // Redirigir a la pasarela de pago
      } else {
        alert(
          "Reserva completada con éxito. Redirigiendo a la pasarela de pago..."
        );
        // window.location.href = "https://www.izipay.pe/pago-simulado"; // Simulación
      }
      disconnectFromTrip(); // Desconectar del socket después de una reserva exitosa
    } catch (error: any) {
      console.error("Error en la reserva:", error);
      setReservationError(
        error.message || "Ocurrió un error inesperado al intentar reservar."
      );
    } finally {
      setReservationLoading(false);
    }
  }, [
    tripSelection,
    passengerData,
    selectedSeats,
    busToDisplay,
    auth, // <-- Añadir auth a las dependencias
    disconnectFromTrip,
  ]);

  // --- RENDERIZADO CONDICIONAL PRINCIPAL ---

  if (serviceLoading) {
    return (
      <div className="w-full h-screen flex justify-center items-center font-redhat bg-gray-100">
        <div className="p-5 text-center text-gray-600 animate-pulse">
          Cargando información del servicio...
        </div>
      </div>
    );
  }

  if (serviceError) {
    return (
      <div className="w-full h-screen flex justify-center items-center font-redhat bg-gray-100">
        <div className="p-5 bg-white shadow-lg rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="my-4 text-gray-700">{serviceError}</p>
          <button
            onClick={loadServiceData}
            className="p-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {renderWhenReady(
        <div className="w-full flex flex-col justify-center items-center font-redhat py-25 bg-gray-100 max-h-full">
          <div className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 self-start">
            Reserva de tours
          </div>
          <div className="align-center items-center inline-block bg-white
          w-full max-w-4/5 md:max-w-3/5 p-4 rounded-lg shadow-md border border-gray-200">
            <Formulario onFormDataChange={setPassengerData} />
            <div className="flex items-center align-center flex-col my-5">
              <div className="font-bold text-lg mt-5 mb-5 self-start">
                Seleccione sus asientos
              </div>
              <FechaHorarioSelector
                onSelectionChange={handleTripSelection}
                fetchHorarios={fetchHorariosDisponibles}
              />
              {/* --- INICIO: Nuevo Cuadro de Estado Dinámico --- */}
              {tripSelection && !isSelecting && uiStatus.status === "idle" && (
                <div className="mt-4">
                  <button
                    onClick={handleStartSelection}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Seleccionar Asientos
                  </button>
                </div>
              )}

              {uiStatus.status === "connecting" && (
                <div className="mt-4 p-2 border rounded bg-gray-100 text-gray-700 animate-pulse">
                  {uiStatus.message}
                </div>
              )}

              {uiStatus.status === "error" && (
                <div className="mt-4 p-2 border rounded bg-red-100 text-red-700 flex justify-between items-center">
                  <span>{uiStatus.message}</span>
                  <button
                    onClick={handleStartSelection}
                    className="ml-4 p-1 px-3 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {/* --- FIN: Nuevo Cuadro de Estado Dinámico --- */}
              {sessionExpired && (
                <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
                  Tu sesión ha expirado. Por favor, selecciona los asientos de
                  nuevo.
                </div>
              )}

              {isConnected && (
                <div>
                  {buses.length > 1 && (
                    <select
                      value={selectedBusOrden || ""}
                      onChange={(e) => setSelectedBusOrden(e.target.value)}
                      className="mt-4 p-2 border rounded"
                    >
                      {buses.map((bus) => (
                        <option key={bus.ordenBus} value={bus.ordenBus}>
                          {`Bus ${bus.ordenBus}`}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="my-4 text-lg font-semibold">
                    Tiempo restante:{" "}
                    <span className="text-blue-600">
                      {formatTime(sessionTimeLeft)}
                    </span>
                  </div>

                  {busToDisplay && (
                    <Mirabus
                      key={busToDisplay.ordenBus} // Importante para que React remonte el componente al cambiar de bus
                      initialSeatsData={busToDisplay.seats}
                      busOrden={busToDisplay.ordenBus}
                      onSelectionChange={setSelectedSeats}
                      onRequestSeatSelection={selectSeat}
                      onRequestSeatDeselection={deselectSeat}
                    />
                  )}
                </div>
              )}
            </div>
            {/* --- BOTON DE RESERVAR --- */}
            {isSelecting && selectedSeats.length > 0 && (
              <div className="mt-8 border-t pt-6">
                {/* --- INICIO: Resumen de la Reserva --- */}
                <div className="mt-6 p-4 border rounded-lg bg-gray-50 space-y-2">
                  <h3 className="font-bold text-lg">Resumen de tu Reserva</h3>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-semibold">{serviceInfo?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Asientos ({selectedSeats.length}):
                    </span>
                    <span className="font-semibold">
                      {selectedSeats.map((s) => s.id).join(", ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-2 border-t mt-2">
                    <span>Total:</span>
                    <span>
                      S/{" "}
                      {(serviceInfo!.price * selectedSeats.length).toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* --- FIN: Resumen de la Reserva --- */}

                <div className="mt-6 text-center">
                  {reservationError && (
                    <div className="p-2 mb-4 text-red-700 bg-red-100 rounded-lg">
                      {reservationError}
                    </div>
                  )}
                  <button
                    onClick={handleReservation}
                    disabled={reservationLoading}
                    className={`w-full p-3 bg-green-600 text-white rounded-lg text-lg font-semibold transition-colors ${
                      reservationLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-green-700"
                    }`}
                  >
                    {reservationLoading
                      ? "Procesando Reserva..."
                      : "Confirmar y Pagar"}
                  </button>
                </div>
              </div>
            )}
            {/* --- FIN --- */}
          </div>
        </div>
      )}
    </>
  );
}
