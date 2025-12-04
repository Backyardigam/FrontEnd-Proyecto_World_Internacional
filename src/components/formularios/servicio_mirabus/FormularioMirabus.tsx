import React, { useState, useCallback, StrictMode, useEffect } from "react";
import { FechaHorarioSelector } from "./FechaHorarioSelector";
import Mirabus from "./Mirabus";
import type { Bus, Seat } from "./seatUtils/interfaceBus";
import Formulario, { type PassengerFormData } from "./Formulario"; // Importar el nuevo componente y su interfaz
import { useAuth } from "../../../utils/authContext";
import { IzipayButton } from "../IziPayButton";
import type { CreatePaymentRequest, CreatePaymentResponse, TicketInput } from "../utils/payment.contract";
import { apiGet, apiPost } from "../../../utils/apiClient";
import { useSocketTrip } from "../../../hooks/useSocketTrip";

//Manejar la llamada de datos desde una ruta API
interface APIScheduleResponse{
  id:string,
  name:string,
  precio:number, // El backend devuelve 'precio'
  schedules:string[]
}

//componente encargado de cargar con todo el formulario normal y la seleccion de asientos
export default function FormularioMirabus() {
  // --- ESTADOS PARA LA CARGA INICIAL DEL SERVICIO ---
  const [serviceInfo, setServiceInfo] = useState<{
    id: string;
    name: string;
    price: number; // Usaremos 'price' internamente
    schedules: string[];
  } | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);

  // --- OBTENER DATOS DEL USUARIO ---
  const { auth, renderWhenReady } = useAuth();

  // --- EFECTO PARA CARGAR LOS DATOS DEL SERVICIO AL MONTAR EL COMPONENTE ---
  const loadServiceData = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const serviceIdName = params.get('servicio');

    if (!serviceIdName) {
      setServiceError("No se ha especificado un servicio en la URL.");
      setServiceLoading(false);
      return;
    }

    setServiceLoading(true);
    setServiceError(null);

    try {
      const data = await apiGet<APIScheduleResponse>(`/service/schedule/${serviceIdName}`);
      // Mapeamos la respuesta de la API a nuestro estado interno
      setServiceInfo({ id: data.id, name: data.name, price: data.precio, schedules: data.schedules });
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
    initiatePayment, // <-- Importamos la nueva función
  } = useSocketTrip();

  // Estado local para guardar los asientos que el usuario ha seleccionado
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // Estado para la carga de la reserva y errores
  const [reservationLoading, setReservationLoading] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [formToken, setFormToken] = useState<string | null>(null);

  const handleTripSelection = useCallback(
    async (fecha: string, horario: string) => {
      disconnectFromTrip();
      setTripSelection({ fecha, horario });
      setIsSelecting(false); // Volver al estado inicial si se cambia la fecha/hora
      setUiStatus({ status: "idle" }); // Resetear el cuadro de estado
      setSelectedBusOrden(null);
      setReservationError(null); // Limpiar cualquier error de reserva anterior
      setFormToken(null); // Limpiar token si se cambia la selección
    },
    [disconnectFromTrip]
  );

  const handleStartSelection = () => {
    if (tripSelection) {
      if (!auth.isAuthenticated) {
        // Redirigir a la página de login, guardando la URL actual para poder volver.
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(
          currentPath
        )}`;
        return;
      }

      const serviceId = serviceInfo?.id || ""; // Usamos el ID del servicio para el backend

      setUiStatus({ status: "connecting", message: "Conectando..." });
      setReservationError(null); // Limpiar cualquier error de reserva anterior

      // Llamamos a connectToTrip. El backend identificará al usuario por su cookie.
      connectToTrip({ ...tripSelection, servicio: serviceId }, (result) => { // El callback ahora solo maneja el error
        if (!result.success) {
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

  // Efecto para reaccionar al estado de la conexión del hook
  useEffect(() => {
    if (isConnected) {
      // Si el hook nos dice que estamos conectados, actualizamos la UI.
      setIsSelecting(true);
      setUiStatus({ status: "idle" }); // Ocultamos el cuadro de "Conectando..."
    }
  }, [isConnected]);

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
    // Guarda para prevenir dobles envíos por clics rápidos.
    if (reservationLoading) return;

    setReservationLoading(true);
    setReservationError(null);
    setFormToken(null);

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

    // 1. Construir el payload según el contrato `CreatePaymentRequest`
    const ticket: TicketInput = {
      serviceId: serviceInfo?.id || "",
      name: passengerData.nombreCompleto,
      email: passengerData.correo,
      phoneNumber: passengerData.celular,
      peopleCount: selectedSeats.length,
      date: tripSelection.fecha,
      schedule: tripSelection.horario + ":00", // El contrato espera HH:mm:ss
      seatID: selectedSeats.map(seat => seat.id),
      orderBus: busToDisplay?.ordenBus || "",
    };

    const payload: CreatePaymentRequest = {
      buyerInfo: {
        email: passengerData.correo,
        firstName: passengerData.nombreCompleto.split(' ')[0] || '',
        lastName: passengerData.nombreCompleto.split(' ').slice(1).join(' ') || '',
      },
      tickets: [ticket],
    };

    console.log("Payload para /boletos/payment:", JSON.stringify(payload, null, 2));

    try {
      // 2. Primero, obtenemos el formToken del backend.
      // Esto crea la orden de pago en nuestra base de datos y en Izipay.
      const responseData = await apiPost<CreatePaymentResponse>(
        "/boletos/payment",
        payload
      );
      console.log("Respuesta del backend:", responseData);

      if (!responseData.formToken) {
        throw new Error("La respuesta del servidor no incluyó un token de pago.");
      }

      // 3. AHORA, y solo ahora, notificamos al socket que el pago ha comenzado.
      // El backend usará esto para marcar los asientos como 'en pago' y no liberarlos
      // si el usuario se desconecta (cierra la pestaña para ir a Izipay).
      const paymentInitiationResponse = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        initiatePayment((response) => resolve(response));
      });

      if (!paymentInitiationResponse.success) {
        // Esto es raro, pero podría pasar si los asientos fueron tomados en el último segundo.
        throw new Error(
          paymentInitiationResponse.error || "No se pudieron asegurar los asientos para el pago final."
        );
      }

      // 4. Si todo fue exitoso, guardamos el token para renderizar el botón de Izipay.
      setFormToken(responseData.formToken);

    } catch (error: any) {
      console.error("Error en la reserva:", error);
      setReservationError(
        error.message || "Ocurrió un error inesperado al procesar la reserva."
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
    serviceInfo,
    disconnectFromTrip,
    initiatePayment,
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
        <div className="w-full flex flex-col justify-center items-center font-redhat py-16 md:py-24 bg-gray-100 min-h-screen">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Reserva para: <span className="text-naranja-c">{serviceInfo?.name}</span>
            </h1>
            <p className="text-lg text-gray-600 mt-2">Completa los siguientes pasos para asegurar tu lugar.</p>
          </div>
          <div className="bg-white w-full max-w-4xl p-6 md:p-8 rounded-lg shadow-lg border border-gray-200">
            <Formulario onFormDataChange={setPassengerData} />
            <div className="flex items-center align-center flex-col my-5">
              <div className="font-bold text-lg mt-5 mb-5 self-start">
                Seleccione sus asientos
              </div>
              <FechaHorarioSelector
                schedules={serviceInfo?.schedules || []}
                onSelectionChange={handleTripSelection}
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
                <div >
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
                  
                  {formToken ? (
                    <>
                      <IzipayButton formToken={formToken} />
                      <p className="mt-4 text-sm text-gray-600">
                        Tus asientos han sido guardados por 10 minutos. Completa el pago en la pasarela segura para confirmarlos definitivamente.
                      </p>
                    </>
                  ) : (
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
                  )}

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
