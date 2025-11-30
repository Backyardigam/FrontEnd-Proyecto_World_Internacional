import React, { useState, useCallback, useEffect } from "react";
import Mirabus from "../../formularios/servicio_mirabus/Mirabus";
import { useSocketTrip } from "../../../hooks/useSocketTrip";
import { apiGet } from "../../../utils/apiClient";

// Definimos la estructura de la respuesta de la nueva API
interface MirabusService {
  id: string;
  name: string;
  schedules: string[];
}

export default function SupervisarViajesView() {
  // --- ESTADOS DE LA UI ---
  const [uiStatus, setUiStatus] = useState<{
    status: "idle" | "loading" | "connecting" | "error";
    message?: string;
  }>({ status: "loading" });

  // --- ESTADOS DE DATOS ---
  const [services, setServices] = useState<MirabusService[]>([]);

  // --- ESTADOS DE SELECCIÓN ---
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSchedule, setSelectedSchedule] = useState<string>("");

  // Este estado combinado representa el viaje completo que se intentará conectar
  const [tripSelection, setTripSelection] = useState<{
    servicio: string;
    fecha: string;
    horario: string;
  } | null>(null);

  const [selectedBusOrden, setSelectedBusOrden] = useState<string | null>(null);

  // --- HOOK DE SOCKET ---
  // Asumimos que el hook `useSocketTrip` expondrá una función `adminToggleSeat`
  const {
    buses,
    isConnected,
    connectToTrip,
    disconnectFromTrip,
    adminToggleSeat,
  } = useSocketTrip();

  // --- EFECTO PARA CARGAR LOS SERVICIOS AL MONTAR EL COMPONENTE ---
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Asumimos que la API existe y devuelve los datos en el formato esperado
        const data = await apiGet<MirabusService[]>("/api/manage/mirabus-services");
        setServices(data);
        if (data.length > 0) {
          // Pre-seleccionar el primer servicio
          setSelectedServiceId(data[0].id);
        }
        setUiStatus({ status: "idle" });
      } catch (error: any) {
        setUiStatus({
          status: "error",
          message: "No se pudieron cargar los servicios de Mirabus.",
        });
      }
    };
    fetchServices();
  }, []);

  // --- MANEJADORES DE EVENTOS ---

  // Se ejecuta cuando el admin cambia cualquier selector
  const handleSelectionChange = () => {
    // Si ya hay una conexión activa, la desconectamos para forzar una nueva conexión
    if (isConnected) {
      disconnectFromTrip();
    }
    setSelectedBusOrden(null); // Reseteamos la selección del bus
  };

  // Se ejecuta cuando el admin presiona el botón para conectarse
  const handleConnect = () => {
    const selectedService = services.find(s => s.id === selectedServiceId);
    if (selectedService && selectedDate && selectedSchedule) {
      const newTripSelection = {
        servicio: selectedService.name,
        fecha: selectedDate,
        horario: selectedSchedule,
      };
      setTripSelection(newTripSelection);

      setUiStatus({ status: "connecting", message: "Conectando al viaje..." });
      connectToTrip(newTripSelection, (result) => {
        if (!result.success) {
          setUiStatus({ status: "error", message: result.error });
        } else {
          setUiStatus({ status: "idle" }); // Conexión exitosa, se oculta el mensaje
        }
      });
    }
  };

  // Esta es la función que se pasa a Mirabus y se ejecuta cuando el admin hace clic en un asiento
  const handleAdminSeatToggle = (seatId: string, busOrden: string) => {
    // Llamamos a la función del hook que emitirá el evento de socket seguro para el admin
    adminToggleSeat(seatId, busOrden);
  };

  // --- EFECTOS ---

  // Selecciona el primer bus por defecto cuando se reciben los datos
  useEffect(() => {
    if (buses.length > 0 && !selectedBusOrden) {
      setSelectedBusOrden(buses[0].ordenBus);
    }
  }, [buses, selectedBusOrden]);

  const busToDisplay = buses.find((b) => b.ordenBus === selectedBusOrden);

  // Horarios disponibles para el servicio seleccionado
  const availableSchedules = services.find(s => s.id === selectedServiceId)?.schedules || [];

  // --- RENDERIZADO ---

  if (uiStatus.status === "loading") {
    return <div className="text-center p-10">Cargando servicios...</div>;
  }

  if (uiStatus.status === "error" && services.length === 0) {
    return <div className="text-center p-10 text-red-600">{uiStatus.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold text-lg mb-3">Seleccionar Viaje</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector de Servicio */}
          <div>
            <label htmlFor="service-selector" className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
            <select
              id="service-selector"
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setSelectedSchedule(""); // Resetear horario al cambiar de servicio
                handleSelectionChange();
              }}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </div>

          {/* Selector de Fecha */}
          <div>
            <label htmlFor="date-selector" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              id="date-selector"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                handleSelectionChange();
              }}
              min={new Date().toISOString().split("T")[0]} // <-- AÑADIDO: No permitir fechas pasadas
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Selector de Horario */}
          <div>
            <label htmlFor="schedule-selector" className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
            <select
              id="schedule-selector"
              value={selectedSchedule}
              onChange={(e) => {
                setSelectedSchedule(e.target.value);
                handleSelectionChange();
              }}
              disabled={!selectedServiceId}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Seleccione un horario</option>
              {availableSchedules.map(schedule => (
                <option key={schedule} value={schedule}>{schedule}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedServiceId && selectedDate && selectedSchedule && !isConnected && (
        <div className="text-center">
          {uiStatus.status === 'error' && <p className="text-red-600 mb-2">{uiStatus.message}</p>}
          <button
            onClick={handleConnect}
            disabled={uiStatus.status === 'connecting'}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uiStatus.status === 'connecting' ? 'Conectando...' : 'Cargar Estado del Bus'}
          </button>
        </div>
      )}

      {isConnected && (
        <div className="p-4 border rounded-lg">
          {buses.length > 1 && (
            <div className="mb-4">
              <label htmlFor="bus-selector" className="mr-2 font-medium">Seleccionar Bus:</label>
              <select
                id="bus-selector"
                value={selectedBusOrden || ""}
                onChange={(e) => setSelectedBusOrden(e.target.value)}
                className="p-2 border rounded"
              >
                {buses.map((bus) => (
                  <option key={bus.ordenBus} value={bus.ordenBus}>
                    {`Bus ${bus.ordenBus}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {busToDisplay ? (
            <Mirabus
              key={busToDisplay.ordenBus}
              initialSeatsData={busToDisplay.seats}
              busOrden={busToDisplay.ordenBus}
              mode="admin" // <-- ¡La clave!
              onAdminSeatToggle={handleAdminSeatToggle}
            />
          ) : <p>Selecciona un bus para visualizar.</p>}
        </div>
      )}
    </div>
  );
}