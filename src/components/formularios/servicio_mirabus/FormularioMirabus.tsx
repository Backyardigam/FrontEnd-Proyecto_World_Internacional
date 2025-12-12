import React, { useState, useCallback, StrictMode, useEffect, useMemo } from "react";
import { useStore } from "@nanostores/react";
import { FechaHorarioSelector } from "./FechaHorarioSelector";
import Mirabus from "./Mirabus";
import type { Seat } from "./seatUtils/interfaceBus";
import Formulario, { type PassengerFormData } from "./Formulario"; // Importar el nuevo componente y su interfaz
import { useAuth } from "../../../utils/authContext";
import { IzipayButton } from "../IziPayButton";
import type { BuyerInfo, TicketItemInput } from "../utils/payment.contract";
import { apiGet} from "../../../utils/apiClient";
import { useSocketTrip } from "../../../hooks/useSocketTrip";
import { $discounts } from "../../../utils/discountStore";
import { getDiscountInfo } from "../../../utils/discountUtils";

//Manejar la llamada de datos desde una ruta API
interface APIScheduleResponse{
  id:string,
  name:string,
  cost:string, // El backend devuelve 'precio' como string
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
      const data = await apiGet<APIScheduleResponse>(`/services/schedule/${serviceIdName}`);
      // --- ¡CAMBIO CLAVE! ---
      // Creamos una función para transformar el nombre del servicio.
      const formatServiceName = (name: string) => {
        return name
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };
      // Mapeamos la respuesta de la API a nuestro estado interno
      setServiceInfo({ id: data.id, name: formatServiceName(data.name), price: parseFloat(data.cost), schedules: data.schedules });
      console.log(data)
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
    initiatePayment,
    stopSessionTimer,
  } = useSocketTrip();

  // Estado local para guardar los asientos que el usuario ha seleccionado
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);

  // --- ESTADOS PARA PREPARAR DATOS PARA EL BOTÓN DE PAGO ---
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);
  const [tickets, setTickets] = useState<TicketItemInput[]>([]);

  // Estado para controlar si el proceso de pago está activo (formulario cargado)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // --- LÓGICA DE DESCUENTOS Y PRECIOS ---
  const allDiscounts = useStore($discounts);
  const serviceDiscount = serviceInfo ? allDiscounts[serviceInfo.id] : undefined;

  const priceDetails = useMemo(() => {
    const originalPrice = serviceInfo?.price || 0;
    const discountInfo = getDiscountInfo(originalPrice, serviceDiscount);
    const stockLimit = serviceDiscount?.discountStock;
    const expirationDate = serviceDiscount?.discountExpiration;

    // Validamos si la fecha seleccionada está dentro del rango de la promoción
    const isDateValid = !expirationDate || !tripSelection?.fecha || tripSelection.fecha <= expirationDate.split("T")[0];

    // Lógica clave: si se supera el stock, el descuento no aplica.
    const applyDiscount = discountInfo.isActive && isDateValid && (
      stockLimit === null || (typeof stockLimit === 'number' && selectedSeats.length <= stockLimit)
    );

    const finalPricePerSeat = applyDiscount ? discountInfo.finalPrice : originalPrice;
    const total = finalPricePerSeat * selectedSeats.length;

    return { ...discountInfo, finalPricePerSeat, total, applyDiscount, stockLimit, isDateValid };
  }, [serviceInfo, serviceDiscount, selectedSeats.length, tripSelection?.fecha]);

  const allFormsFilled = useMemo(() => {
    return !!(passengerData?.nombreCompleto && passengerData.celular && passengerData.correo);
  }, [passengerData]);

  // --- MANEJADORES DE EVENTOS Y LÓGICA DE UI ---
  const handleTripSelection = useCallback(
    async (fecha: string, horario: string) => {
      disconnectFromTrip();
      setTripSelection({ fecha, horario });
      setIsSelecting(false); // Volver al estado inicial si se cambia la fecha/hora
      setUiStatus({ status: "idle" }); // Resetear el cuadro de estado
      setSelectedBusOrden(null);
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

      // Llamamos a connectToTrip. El backend identificará al usuario por su cookie.
      connectToTrip({ ...tripSelection, servicio: serviceId }, (result) => { // El callback ahora solo maneja el error
        if (!result.success) {
          // Si la conexión falla, el hook se limpiará y `isConnected` será false.
          // El useEffect se encargará de actualizar la UI a 'error'.
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

  // Efecto centralizado para reaccionar a los cambios de estado del socket.
  useEffect(() => {
    if (isConnected) {
      // Si estamos conectados, entramos en modo selección y limpiamos el estado de la UI.
      setIsSelecting(true);
      setUiStatus({ status: "idle" });
    } else if (sessionExpired) {
      // Si la sesión expiró, reseteamos la UI y mostramos un mensaje.
      setIsSelecting(false);
      setUiStatus({ status: "error", message: "Tu sesión ha expirado. Por favor, selecciona los asientos de nuevo." });
    } else {
      setIsSelecting(false);
    }
  }, [isConnected, sessionExpired]);

  // Formatear el tiempo restante para mostrarlo como MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // --- EFECTO PARA PREPARAR LOS DATOS PARA EL BOTÓN DE PAGO ---
  useEffect(() => {
    if (isSelecting && allFormsFilled && selectedSeats.length > 0 && tripSelection && serviceInfo && passengerData) {
      const fullName = passengerData.nombreCompleto || "";
      const firstName = fullName.split(" ")[0] || "";
      const lastName = fullName.split(" ").slice(1).join(" ") || "";

      setBuyerInfo({
        email: passengerData.correo,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: passengerData.celular,
        // documentType: passengerData.tipoDocumento,
        // documentNumber: passengerData.numeroDocumento,
      });

      // El backend espera el horario en formato HH:mm:ss
      // const scheduleTimeParts = tripSelection.horario.split(" ")[0].split(":"); // "8:00 AM" -> ["8", "00"]
      const scheduleHHMMSS = `${tripSelection.horario}:00`;

      const ticket: TicketItemInput = {
        serviceId: serviceInfo.id,
        name: passengerData.nombreCompleto,
        email: passengerData.correo,
        phoneNumber: passengerData.celular,
        peopleCount: selectedSeats.length,
        price: priceDetails.finalPricePerSeat, // Usamos el precio final calculado
        date: tripSelection.fecha,
        schedule: scheduleHHMMSS,
        seatID: selectedSeats.map(seat => seat.id),
        orderBus: busToDisplay?.ordenBus || "",
      };
      setTickets([ticket]);

    } else {
      // Si las condiciones no se cumplen, reseteamos los datos de pago
      setBuyerInfo(null);
      setTickets([]);
    }
  }, [isSelecting, allFormsFilled, selectedSeats, tripSelection, serviceInfo, passengerData, busToDisplay, priceDetails.finalPricePerSeat]);

  // --- HANDLERS PARA EL FLUJO DE PAGO ---
  const handlePaymentFormLoaded = useCallback(() => {
    // 1. Bloquear la UI de selección
    setIsPaymentProcessing(true);
    // 2. Detener el temporizador para evitar desconexión por timeout mientras el usuario paga
    stopSessionTimer();
  }, [stopSessionTimer]);

  const handlePaymentSuccess = useCallback(async (orderId: string) => {
    // 1. Emitir evento de socket para reservar asientos (initiatePayment)
    return new Promise<void>((resolve) => {
      initiatePayment(orderId, (response) => {
        if (!response.success) {
          console.warn("El socket no pudo confirmar el pago, pero la redirección verificará el estado.", response.error);
        }
        console.log("Respuesta de initiatePayment:", response);
        resolve();
      });
    });
  }, [initiatePayment]);

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
              <div className="text-sm text-gray-500 mt-5 mb-5 self-start">
                Porfavor seleccione la fecha y horario en la que desee reservar para poder proceder a la reserva de asientos.
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
                      disabled={isPaymentProcessing} // Bloqueamos si se está pagando
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
                {/* --- INICIO: Desglose de Precio --- */}
                <div className="mb-4 p-4 border rounded-lg bg-blue-50 border-blue-200 space-y-2">
                  <h3 className="font-bold text-lg text-blue-800">Precio por Asiento</h3>
                  {priceDetails.isActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Precio Original:</span>
                      <span className="font-semibold line-through">S/ {serviceInfo?.price.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Precio Final por Asiento:</span>
                    <span className="font-bold text-xl text-blue-700">S/ {priceDetails.finalPricePerSeat.toFixed(2)}</span>
                  </div>
                  {priceDetails.isActive && !priceDetails.applyDiscount && (
                    <div className="pt-2 text-xs text-orange-700 bg-orange-100 p-2 rounded-md">
                      {!priceDetails.isDateValid ? (
                        <span><strong>Nota:</strong> La oferta no es válida para la fecha seleccionada.</span>
                      ) : priceDetails.stockLimit && selectedSeats.length > priceDetails.stockLimit ? (
                        <span><strong>Nota:</strong> La oferta es válida hasta <strong>{priceDetails.stockLimit}</strong> asientos. Al seleccionar más, se aplica el precio original a todos.</span>
                      ) : null}
                    </div>
                  )}
                   {priceDetails.expirationMessage && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      {priceDetails.expirationMessage}
                    </div>
                  )}
                </div>
                {/* --- FIN: Desglose de Precio --- */}
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
                      S/ {priceDetails.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                {/* --- FIN: Resumen de la Reserva --- */}

                <div className="mt-6 text-center">                  
                  {buyerInfo && tickets.length > 0 ? (
                    <>
                      <IzipayButton 
                        buyerInfo={buyerInfo}
                        tickets={tickets}
                        disabled={!allFormsFilled}
                        onPaymentFormLoaded={handlePaymentFormLoaded}
                        onPaymentSuccess={handlePaymentSuccess}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">Completa tus datos para continuar con el pago.</p>
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
