import React, { useState, useEffect } from "react";
import { apiGet, ApiError } from "../../../utils/apiClient";
import type { TicketData } from "../../boletos/Boleto"; // Reutilizamos la interfaz

interface BoletoDetalleProps {
  ticketId: string;
  onClose: () => void;
}

// Funciones de formato reutilizadas
// const formatDate = (dateString: string) =>
//   new Date(dateString).toLocaleDateString("es-ES", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });

const formatDateTime = (dateString: string) =>
  new Date(dateString).toLocaleString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatCurrency = (amount: number) => `S/ ${amount.toFixed(2)}`;

const formatServiceName = (name: string) => {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function BoletoDetalleView({ ticketId, onClose }: BoletoDetalleProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        setLoading(true);
        // --- LLAMADA A LA API ---
        // Reemplaza esta ruta con tu endpoint real
        const data = await apiGet<TicketData>(`/boletos/admin_ticket/${ticketId}`);
        // -----------------------
        setTicket(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Ocurrió un error inesperado al cargar los detalles del boleto.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  if (loading) {
    return <p>Cargando detalles del boleto...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!ticket) {
    return <p>No se encontraron los datos del boleto.</p>;
  }

  return (
    <div>
      <button onClick={onClose} className="mb-6 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
        &larr; Volver a la lista
      </button>

      <div className="ticket-container bg-white rounded-xl shadow-lg overflow-hidden border">
        {/* Cabecera del Boleto */}
        <header className="bg-naranja-f text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{formatServiceName(ticket.service)}</h1>
            <p className="text-orange-100">Boleto Electrónico (Vista Admin)</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm">CÓDIGO DE RESERVA</p>
            <p className="font-bold text-xl tracking-wider">{ticket.ticketCode}</p>
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
              <p className="font-medium text-gray-900">{ticket.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{ticket.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium text-gray-900">{ticket.phoneNumber}</p>
            </div>
          </div>

          {/* QR Code Placeholder */}
          {/* <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Código QR</p>
          </div> */}
        </section>

        {/* Detalles del Servicio */}
        <section className="p-6 md:p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Fecha del Tour</p>
            <p className="font-semibold text-lg text-gray-900">{ticket.date}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Horario</p>
            <p className="font-semibold text-lg text-gray-900">{ticket.schedule}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">N° de Personas</p>
            <p className="font-semibold text-lg text-gray-900">{ticket.peopleCount}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Costo Total</p>
            <p className="font-bold text-2xl text-naranja-f">{formatCurrency(ticket.totalCost)}</p>
          </div>
        </section>

        {/* Sección Opcional para Mirabus */}
        {(ticket.orderBus || (ticket.seats && ticket.seats.length > 0)) && (
          <section className="p-6 md:p-8 border-t bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Detalles de Asignación (Mirabus)
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {ticket.orderBus && (
                <div>
                  <p className="text-sm text-gray-500">Bus Asignado</p>
                  <p className="font-semibold text-lg text-gray-900">Bus {ticket.orderBus}</p>
                </div>
              )}
              {ticket.seats && ticket.seats.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500">Asientos Reservados</p>
                  <p className="font-semibold text-lg text-gray-900">{ticket.seats.join(', ')}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pie de página del Boleto */}
        <footer className="bg-gray-50 p-4 text-xs text-gray-500 text-center border-t">
          Boleto generado el: {formatDateTime(ticket.createdAt)}.
        </footer>
      </div>
    </div>
  );
}