import React, { useState, useEffect } from "react";
// Asegúrate de ajustar las rutas de importación según tu estructura de carpetas
import Mirabus from "../../formularios/servicio_mirabus/Mirabus";
import { useSocketTrip } from "../../../hooks/useSocketTrip";
import { apiGet } from "../../../utils/apiClient";
import type { IServicesTypeMirabus } from './SupervisarViajes.utils';

// Props para recibir datos cuando venimos de "Reservar"
interface Props {
  onBack: () => void;
  initialData?: {
    serviceId: string;
    serviceName?: string;
    date: string;
    schedule: string;
  };
}

export default function MirabusReservationView({ initialData, onBack }: Props) {
  // --- ESTADOS DE LA UI ---
  const [uiStatus, setUiStatus] = useState<{
    status: "idle" | "loading" | "connecting" | "error";
    message?: string;
  }>({ status: "loading" });

  // --- ESTADOS DE DATOS ---
  // Usamos tu tipo consistente: IServicesTypeMirabus
  const [services, setServices] = useState<IServicesTypeMirabus[]>([]);

  // --- ESTADOS DE SELECCIÓN ---
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialData?.serviceId || "");
  const [selectedDate, setSelectedDate] = useState<string>(initialData?.date || "");
  const [selectedSchedule, setSelectedSchedule] = useState<string>(initialData?.schedule || "");

  const [selectedBusOrden, setSelectedBusOrden] = useState<string | null>(null);

  // --- HOOK DE SOCKET ---
  const {
    buses,
    isConnected,
    connectToTrip,
    disconnectFromTrip,
    adminToggleSeat,
  } = useSocketTrip();

  // --- 1. CARGA DE SERVICIOS E INICIALIZACIÓN ---
  useEffect(() => {
    const fetchServices = async () => {
      try {
        // Usamos tu ruta consistente: api/manage/mirabus/filters
        const data = await apiGet<IServicesTypeMirabus[]>("/manage/mirabus/filters");
        setServices(data);

        // Lógica de pre-selección:
        if (!initialData?.serviceId && data.length > 0 && !selectedServiceId) {
          // Si es NUEVO VIAJE, seleccionamos el primero por defecto
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
  }, []); // Solo al montar

  // --- MANEJADORES ---

  const handleSelectionChange = () => {
    if (isConnected) disconnectFromTrip();

    setUiStatus({ status: "idle" });
    setSelectedBusOrden(null);
  };

  const handleConnect = () => {
    if (selectedServiceId && selectedDate && selectedSchedule) {
      const tripToConnect = {
        servicio: selectedServiceId,
        fecha: selectedDate,
        horario: selectedSchedule,
      };
      setUiStatus({ status: "connecting", message: "Sincronizando con el bus..." });

      connectToTrip(tripToConnect, (result) => {
        if (!result.success) {
          setUiStatus({ status: "error", message: result.error });
        } else {
          setUiStatus({ status: "idle" });
        }
      });
    }
  };

  const handleAdminSeatToggle = (seatId: string, busOrden: string) => {
    adminToggleSeat(seatId, busOrden);
  };

  // --- EFECTOS SECUNDARIOS ---

  // Auto-seleccionar primer bus al conectar
  useEffect(() => {
    if (buses.length > 0 && !selectedBusOrden) {
      setSelectedBusOrden(buses[0].ordenBus);
    }
  }, [buses, selectedBusOrden]);

  // Variables derivadas
  const busToDisplay = buses.find((b) => b.ordenBus === selectedBusOrden);

  const availableSchedules = services.find(s => s.id === selectedServiceId)?.schedule || [];

  return (
    <div className="flex flex-col gap-6">
      
      {/* --- BOTÓN DE RETROCESO Y TÍTULO --- */}
      <div className="flex items-center gap-4 border-b pb-2">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
          title="Volver al Listado"
        >
          {/* Ícono simple de flecha izquierda */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          {initialData ? "Reservar Asiento" : "Crear / Gestionar Viaje"}
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* --- TARJETA IZQUIERDA: SELECTORES (Col 4/12) --- */}
        <div className="lg:col-span-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="space-y-5">

            {/* Servicio */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Servicio</label>
              <select
                value={selectedServiceId}
                onChange={(e) => {
                  setSelectedServiceId(e.target.value);
                  setSelectedSchedule("");
                  handleSelectionChange();
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                {!initialData && <option value="">Seleccione servicio</option>}
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={selectedDate}
                // No permitir fechas pasadas
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  handleSelectionChange();
                }}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            {/* Horario */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Horario</label>
              <select
                value={selectedSchedule}
                onChange={(e) => {
                  setSelectedSchedule(e.target.value);
                  handleSelectionChange();
                }}
                disabled={!selectedServiceId}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400 outline-none transition-all"
              >
                <option value="">{selectedServiceId ? 'Seleccione horario' : '-'}</option>
                {availableSchedules.map((time, idx) => (
                  <option key={idx} value={time}>{time}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* --- TARJETA DERECHA: VISUALIZACIÓN / SOCKET (Col 8/12) --- */}
        <div className="lg:col-span-8 bg-white p-6 rounded-lg shadow-md border border-gray-200 min-h-[400px] flex flex-col items-center justify-center relative">

          {/* Caso 1: Error Global */}
          {uiStatus.status === "error" && !isConnected && (
            <div className="text-red-500 font-medium bg-red-50 p-4 rounded text-center">
              <p>⚠️ {uiStatus.message}</p>
            </div>
          )}

          {/* Caso 2: Listo para conectar (Inputs llenos, pero no conectado) */}
          {!isConnected && selectedServiceId && selectedDate && selectedSchedule && (
            <div className="text-center animate-fade-in">
              <h3 className="text-lg font-medium text-gray-700 mb-2">Configuración Lista</h3>
              <p className="text-gray-500 mb-6 text-sm">Carga el mapa del bus para ver la disponibilidad en tiempo real.</p>

              <button
                onClick={handleConnect}
                disabled={uiStatus.status === 'connecting'}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow transition-transform transform active:scale-95 flex items-center gap-2 mx-auto"
              >
                {uiStatus.status === 'connecting' ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Conectando...
                  </>
                ) : (
                  "Cargar Estado del Bus"
                )}
              </button>
            </div>
          )}

          {/* Caso 3: Incompleto (Falta seleccionar algo) */}
          {!isConnected && (!selectedServiceId || !selectedDate || !selectedSchedule) && (
            <div className="text-gray-400 text-center">
              <p className="text-5xl mb-4 opacity-20">🚌</p>
              <p>Selecciona Servicio, Fecha y Horario <br /> en el panel izquierdo para continuar.</p>
            </div>
          )}

          {/* Caso 4: CONECTADO (Mostrar Bus) */}
          {isConnected && (
            <div className="w-full h-full flex flex-col">

              {/* Header del Panel Derecho (Selector de bus si hay varios) */}
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h3 className="font-bold text-gray-700">Selecciona tu Asiento</h3>
                {buses.length > 1 && (
                  <select
                    value={selectedBusOrden || ""}
                    onChange={(e) => setSelectedBusOrden(e.target.value)}
                    className="text-sm border-gray-300 rounded border p-1"
                  >
                    {buses.map(b => <option key={b.ordenBus} value={b.ordenBus}>Bus {b.ordenBus}</option>)}
                  </select>
                )}
              </div>

              {/* Componente Mirabus */}
              <div className="flex-grow flex justify-center overflow-auto p-2">
                {busToDisplay ? (
                  <Mirabus
                    key={busToDisplay.ordenBus}
                    initialSeatsData={busToDisplay.seats}
                    busOrden={busToDisplay.ordenBus}
                    mode="admin"
                    onAdminSeatToggle={handleAdminSeatToggle}
                  />
                ) : (
                  <p>Cargando datos del bus...</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}