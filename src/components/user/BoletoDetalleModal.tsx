import React, { useState, useEffect } from "react";
import { apiGet, ApiError } from "../../utils/apiClient";
import type { TicketData } from "../boletos/Boleto"; // Reutilizamos la interfaz

interface BoletoDetalleModalProps {
  ticketId: string;
  onClose: () => void;
}

// Funciones de formato reutilizadas
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

export default function BoletoDetalleModal({ ticketId, onClose }: BoletoDetalleModalProps) {
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      try {
        setLoading(true);
        // Endpoint específico del cliente para obtener detalles de un boleto
        const data = await apiGet<TicketData>(`/boletos/cliente/${ticketId}`);
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

  // Efecto para cerrar el modal con la tecla 'Escape'
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose} // Cierra el modal al hacer clic en el overlay
    >
      <div 
        className="bg-gray-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        {loading && <p>Cargando detalles del boleto...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {ticket && (
          <div className="ticket-container bg-white rounded-xl shadow-lg overflow-hidden border">
            {/* Cabecera */}
            <header className="bg-naranja-f text-white p-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{ticket.service}</h1>
                <p className="text-orange-100">Boleto Electrónico</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm">CÓDIGO DE RESERVA</p>
                <p className="font-bold text-xl tracking-wider">{ticket.ticketCode}</p>
              </div>
            </header>

            {/* Detalles del Pasajero */}
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
              <div className="flex flex-col items-center justify-center bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Código QR (Próximamente)</p>
              </div>
            </section>

            {/* Detalles del Servicio */}
            <section className="p-6 md:p-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">Fecha del Tour</p>
                <p className="font-semibold text-lg text-gray-900">{formatDate(ticket.date)}</p>
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

            {/* Detalles de Mirabus (Opcional) */}
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

            {/* Pie de página */}
            <footer className="bg-gray-50 p-4 text-xs text-gray-500 text-center border-t">
              Boleto generado el: {formatDateTime(ticket.createdAt)}.
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}