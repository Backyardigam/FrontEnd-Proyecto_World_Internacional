import React, { useState, useEffect, useRef } from "react";

import { apiGet, ApiError } from "../../utils/apiClient";
export interface TicketData {
  ticketCode: string;
  peopleCount: number;
  name: string;
  phoneNumber: string;
  email: string;
  schedule: string;
  date: string;
  orderBus?: string;
  seats?: string[];
  totalCost: number;
  createdAt: string;
  service: string;
}

interface BoletoProps {}
// Funciones para formatear los datos
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

const POLLING_INTERVAL = 3000; // 3 segundos
const MAX_POLLING_ATTEMPTS = 20; // Máximo 20 intentos (1 minuto)

export default function Boleto({}: BoletoProps) {
  const [ticketsData, setTicketsData] = useState<TicketData[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "paid" | "failed" | "expired" | null
  >(null);
  const pollingAttemptsRef = useRef<number>(0); // Usamos useRef para el contador de intentos

  useEffect(() => {
    // Asegurarnos de que este código solo se ejecute en el navegador.
    if (typeof window === 'undefined') {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("id");

    if (!paymentId) {
      setError(
        "No se encontró el ID de pago en la URL. Asegúrate de que la URL sea correcta."
      );
      setLoading(false);
      return;
    }

    let pollingTimer: NodeJS.Timeout;

    const fetchTicketData = async (id: string) => {
      try {
        // --- LLAMADA A LA API #2: OBTENER DATOS DEL BOLETO ---
        // Aquí se hace la llamada para obtener los detalles del boleto una vez que el pago está confirmado.
        // DEBES REEMPLAZAR ESTA RUTA CON TU ENDPOINT REAL.
        const data = await apiGet<TicketData | TicketData[]>(`/api/tickets/by-payment/${id}`);
        // ----------------------------------------------------

        // Normalizamos la respuesta para que siempre sea un array.
        const ticketsArray = Array.isArray(data) ? data : [data];

        setTicketsData(ticketsArray);
        setLoading(false); // Solo se establece a false después de obtener los datos del boleto
      } catch (err) {
        console.error("Error al obtener datos del boleto:", err);
        if (err instanceof ApiError) {
          setError(
            `Error del servidor al obtener el boleto: ${err.message} (Código: ${err.status}).`
          );
        } else {
          setError(
            "Ocurrió un error inesperado al obtener los detalles del boleto."
          );
        }
        setLoading(false); // También se establece a false en caso de error
      }
    };

    const pollPaymentStatus = async (id: string) => {
      if (pollingAttemptsRef.current >= MAX_POLLING_ATTEMPTS) {
        setError(
          "El pago tardó demasiado en procesarse. Por favor, contacta a soporte si el problema persiste."
        );
        setPaymentStatus("failed");
        setLoading(false);
        return;
      }

      try {
        // --- LLAMADA A LA API #1: VERIFICAR ESTADO DEL PAGO (POLLING) ---
        // Aquí se consulta repetidamente el estado del pago.
        // DEBES REEMPLAZAR ESTA RUTA CON TU ENDPOINT REAL.
        const statusResponse = await apiGet<{
          status: "pending" | "paid" | "failed" | "expired";
          message?: string;
        }>(`/api/payments/${id}/status`);
        // ----------------------------------------------------------------

        setPaymentStatus(statusResponse.status);

        if (statusResponse.status === "paid") {
          clearTimeout(pollingTimer); // Detener el polling
          await fetchTicketData(id);
        } else if (statusResponse.status === "pending") {
          pollingAttemptsRef.current += 1; // Incrementar el contador de intentos
          pollingTimer = setTimeout(
            () => pollPaymentStatus(id),
            POLLING_INTERVAL
          );
        } else {
          // 'failed' o 'expired'
          setError(
            statusResponse.message ||
              "El pago no se procesó correctamente. Por favor, verifica tu información o intenta de nuevo."
          );
          setLoading(false);
        }
      } catch (err) {
        clearTimeout(pollingTimer);
        console.error("Error al consultar estado de pago:", err);
        if (err instanceof ApiError) {
          setError(
            `Error del servidor al verificar el pago: ${err.message} (Código: ${err.status}).`
          );
        } else {
          setError(
            "Ocurrió un error inesperado al verificar el estado del pago."
          );
        }
        setLoading(false);
      }
    };

    // Iniciar el proceso de polling
    pollPaymentStatus(paymentId);

    return () => {
      clearTimeout(pollingTimer); // Limpiar el temporizador al desmontar el componente
    };
  }, []); // Array de dependencias vacío: se ejecuta solo una vez al montar

  // Lógica de renderizado basada en los estados
  if (loading) {
    return (
      <div className="text-center p-8">
        <p className="text-xl text-gray-700">Cargando tu boleto...</p>
        <div className="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-naranja-f mx-auto"></div>
        {paymentStatus === "pending" && (
          <p className="mt-2 text-gray-600">
            Verificando estado del pago (intento {pollingAttemptsRef.current}/
            {MAX_POLLING_ATTEMPTS})...
          </p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="text-xl font-bold">¡Lo sentimos!</p>
        <p className="mt-2">{error}</p>
        <p className="mt-4 text-sm">
          Por favor, intenta de nuevo o contacta a soporte si el problema
          persiste.
        </p>
      </div>
    );
  }

  if (paymentStatus === "failed" || paymentStatus === "expired") {
    return (
      <div className="text-center p-8 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
        <p className="text-xl font-bold">Pago no procesado</p>
        <p className="mt-2">
          Tu pago no pudo ser completado o ha expirado. Por favor, verifica tu
          información o intenta con otro método de pago.
        </p>
        <p className="mt-4 text-sm">
          Si crees que esto es un error, contacta a soporte.
        </p>
      </div>
    );
  }

  if (!ticketsData || ticketsData.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-100 text-gray-700 rounded-lg">
        <p className="text-xl font-bold">Boleto no encontrado</p>
        <p className="mt-2">
          No pudimos encontrar los detalles de tu boleto. Asegúrate de que el
          enlace sea correcto.
        </p>
      </div>
    );
  }

  // Renderizar el boleto real cuando los datos estén disponibles
  return (
    <>
      {/* Este div envuelve todos los boletos para la generación del PDF */}
      <div id="tickets-container" className="space-y-8">
        {ticketsData.map((ticketData, index) => (
          <div
            key={ticketData.ticketCode}
            className="ticket-container bg-white rounded-xl shadow-lg overflow-hidden"
          >
            {/* Cabecera del Boleto */}
            <header className="bg-naranja-f text-white p-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {ticketData.service}
                </h1>
                <p className="text-orange-100">Boleto Electrónico</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">CÓDIGO DE RESERVA</p>
                <p className="font-bold text-xl tracking-wider">
                  {ticketData.ticketCode}
                </p>
              </div>
            </header>

            {/* Detalles del Pasajero y Viaje */}
            <section className="p-6 md:p-8 grid md:grid-cols-3 gap-6 border-b">
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
                  Detalles del Pasajero
                </h2>
                <div>
                  <p className="text-sm text-gray-500">Nombre Completo</p>
                  <p className="font-medium text-gray-900">{ticketData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{ticketData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-900">
                    {ticketData.phoneNumber}
                  </p>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div
                className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg"
                data-html2canvas-ignore="true"
              >
                <svg
                  className="w-24 h-24 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="0.5"
                    d="M12 4v16m8-8H4"
                  ></path>
                  <path d="M3.5 3.5h17v17h-17z" strokeWidth="1"></path>
                  <path d="M5.5 5.5h5v5h-5zM13.5 5.5h5v5h-5zM5.5 13.5h5v5h-5z"></path>
                </svg>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Presenta este código al abordar
                </p>
              </div>
            </section>

            {/* Detalles del Servicio */}
            <section className="p-6 md:p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Fecha del Tour</p>
                <p className="font-semibold text-lg text-gray-900">
                  {formatDate(ticketData.date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Horario</p>
                <p className="font-semibold text-lg text-gray-900">
                  {ticketData.schedule}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">N° de Personas</p>
                <p className="font-semibold text-lg text-gray-900">
                  {ticketData.peopleCount}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Costo Total</p>
                <p className="font-bold text-2xl text-naranja-f">
                  {formatCurrency(ticketData.totalCost)}
                </p>
              </div>
            </section>

            {/* Sección Opcional para Mirabus: Muestra el bus y los asientos si existen */}
            {(ticketData.orderBus ||
              (ticketData.seats && ticketData.seats.length > 0)) && (
              <section className="p-6 md:p-8 border-t bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Detalles de Asignación (Mirabus)
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {ticketData.orderBus && (
                    <div>
                      <p className="text-sm text-gray-500">Bus Asignado</p>
                      <p className="font-semibold text-lg text-gray-900">
                        Bus {ticketData.orderBus}
                      </p>
                    </div>
                  )}
                  {ticketData.seats && ticketData.seats.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Asientos Reservados</p>
                      <p className="font-semibold text-lg text-gray-900">
                        {ticketData.seats.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Pie de página del Boleto */}
            <footer className="bg-gray-50 p-4 text-xs text-gray-500 text-center border-t">
              Boleto generado el: {formatDateTime(ticketData.createdAt)}. Gracias
              por elegir World Internacional.
            </footer>
          </div>
        ))}
      </div>
    </>
  );
}
