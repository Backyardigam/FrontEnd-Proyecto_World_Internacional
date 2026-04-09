import { useState, useEffect } from "react";
import { apiGet, ApiError } from "../../../../utils/apiClient";
import { generarExcel } from "../../../../utils/reporte_excel/reporteExcel";

// Interfaz basada en la estructura proporcionada
interface ReportTicket {
  id: string;
  ticketCode: string;
  name: string;
  email: string;
  service: string;
  date: string;
  schedule: string;
  peopleCount: number;
  seller: string;
  sellerObservation: string;
  createdAt: string;
}

interface ServiceInfo {
  id: string;
  name: string;
}

export default function GenerarReporte() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [tickets, setTickets] = useState<ReportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Estados para los filtros
  const [selectedService, setSelectedService] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Cargar servicios al inicio para el select
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await apiGet<ServiceInfo[]>("/manage/mirabus-services");
        setServices(data);
      } catch (err) {
        console.error("Error al cargar los servicios:", err);
      }
    };
    fetchServices();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    const params = new URLSearchParams();
    if (selectedService) params.append("servicio", selectedService);
    if (startDate) params.append("fechaInicio", startDate);
    if (endDate) params.append("fechaFin", endDate);
    if (startTime) params.append("horaInicio", startTime);
    if (endTime) params.append("horaFin", endTime);

    try {
      const data = await apiGet<ReportTicket[]>(`/boletos/reporte?${params.toString()}`);
      setTickets(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setTickets([]); // Si no hay resultados, vaciamos la tabla
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al generar el reporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    generarExcel({
      fechaInicio: startDate,
      fechaFin: endDate,
      horaInicio: startTime,
      horaFin: endTime,
      registros: tickets
    });
  };

  // Helper para formatear el nombre del servicio
  const formatServiceName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div>
      {/* Panel de Filtros */}
      <div className="p-4 border rounded-lg bg-gray-50 mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">Filtros del Reporte</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Servicio</label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Todos los servicios</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha Fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora Inicio</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hora Fin</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2 border rounded-md" />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Buscando..." : "Buscar Registros"}
          </button>
          <button
            onClick={handleExportExcel}
            disabled={tickets.length === 0 || loading}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Resultados */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {hasSearched && !loading && !error && (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Servicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Emisión</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider">Cant.</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Vendedor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Observaciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-sm">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600">{ticket.ticketCode}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">{ticket.name}</p>
                      <p className="text-xs text-gray-500">{ticket.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-800">{formatServiceName(ticket.service)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{ticket.date} <span className="font-medium text-gray-900 ml-1">{ticket.schedule}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {new Date(ticket.createdAt).toLocaleString("es-PE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-gray-800">{ticket.peopleCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-800">{ticket.seller}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={ticket.sellerObservation}>{ticket.sellerObservation || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No se encontraron registros para los filtros seleccionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}