import React, { useState, useEffect, useMemo } from "react";
import { apiGet, ApiError } from "../../../utils/apiClient";
import BoletoDetalleView from "./BoletoDetalleView";

// Interfaz para los datos del boleto que esperamos de la API
interface TicketSummary {
  id: string;
  ticketCode: string;
  name: string;
  email: string;
  service: string;
  date: string;
  schedule: string;
  peopleCount: number;
}

// Interfaz para los datos de los servicios que usamos para los filtros
interface ServiceInfo {
  id_name: string; // ej: 'valle_viejo'
  name: string;    // ej: 'Valle Viejo'
  schedules: string[];
}

export default function VistaBoletos() {
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);

  // Estados para los filtros
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');

  // Estado para mostrar la vista de detalle de un boleto
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial de todos los boletos y la lista de servicios para los filtros
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Hacemos ambas llamadas en paralelo para más eficiencia
        const [ticketsData, servicesData] = await Promise.all([
          apiGet<TicketSummary[]>('/boletos/admin'),
          apiGet<ServiceInfo[]>('/manage/mirabus-services') // Endpoint hipotético
        ]);
        setTickets(ticketsData);
        setServices(servicesData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Ocurrió un error inesperado al cargar los datos.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleFilterSubmit = async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();

    if (selectedService) {
      params.append('servicio', selectedService);
    }
    if (selectedDate) {
      params.append('fecha', selectedDate);
    }
    // Regla de negocio: El horario solo se envía si el servicio también está seleccionado.
    if (selectedService && selectedSchedule) {
      params.append('horario', selectedSchedule);
    }

    const queryString = params.toString();
    const url = `/boletos/admin/?${queryString}`;

    try {
      const filteredTickets = await apiGet<TicketSummary[]>(url);
      setTickets(filteredTickets);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al aplicar los filtros.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedService('');
    setSelectedDate('');
    setSelectedSchedule('');
    // Opcional: volver a cargar todos los boletos al limpiar
    // handleFilterSubmit(); // Esto se haría con los estados ya limpios
  };

  // Horarios disponibles basados en el servicio seleccionado
  const availableSchedules = useMemo(() => {
    if (!selectedService) return [];
    const service = services.find(s => s.id_name === selectedService);
    return service?.schedules || [];
  }, [selectedService, services]);

  // Efecto para resetear el horario si el servicio cambia y el horario actual no es válido
  useEffect(() => {
    if (selectedSchedule && !availableSchedules.includes(selectedSchedule)) {
      setSelectedSchedule('');
    }
  }, [selectedService, selectedSchedule, availableSchedules]);

  if (viewingTicketId) {
    return <BoletoDetalleView ticketId={viewingTicketId} onClose={() => setViewingTicketId(null)} />;
  }

  return (
    <div>
      {/* Panel de Filtros */}
      <div className="p-4 border rounded-lg bg-gray-50 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full p-2 border rounded-md">
            <option value="">Todos los Servicios</option>
            {services.map(s => <option key={s.id_name} value={s.id_name}>{s.name}</option>)}
          </select>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-2 border rounded-md" />
          <select value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)} disabled={!selectedService} className="w-full p-2 border rounded-md disabled:bg-gray-200">
            <option value="">Cualquier Horario</option>
            {availableSchedules.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleFilterSubmit} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Filtrar</button>
            <button onClick={handleClearFilters} className="w-full px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-md hover:bg-gray-400">Limpiar</button>
          </div>
        </div>
      </div>

      {/* Tabla de Resultados */}
      {loading ? (
        <p>Cargando boletos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha / Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personas</th>
                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.length > 0 ? tickets.map(ticket => (
                <tr key={ticket.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">{ticket.ticketCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                    <div className="text-sm text-gray-500">{ticket.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{ticket.service}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(ticket.date).toLocaleDateString()} <span className="font-semibold">{ticket.schedule}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-800">{ticket.peopleCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => setViewingTicketId(ticket.id)} className="text-white hover:bg-blue-800 font-semibold bg-blue-500 px-3 py-1 rounded-2xl">Detalles</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No se encontraron boletos con los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}