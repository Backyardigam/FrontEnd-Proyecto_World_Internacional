import React, { useState, useEffect, useMemo } from "react";
import { apiGet, ApiError } from "../../../utils/apiClient";
import type { ISeatDistributionItem } from "../admin_utils/mirabusAdmin";

interface BusService{
  //Como esto pueden llegar en array, cada uno es un bus en el que pueden ir multiples asientos
  distribution:ISeatDistributionItem[];
  orderBus:string;//B-01
}

interface BoletosService { //Boletos que hay reservados para ese servicio
  //en caso sea mirabus necesitamos saber que asientos corresponden al boleto
  idSeat?:string[];
  //parametro que puede llegar nulo o nisiquiera llegar, nos sirve para identificar a que bus iria el boleto
  orderBus?:string; //B-01
  nombre:string;
  peopleCount:number;//aunque es un dato redundante para mirabus, para los servicios normales, nos ayudara a saber cuantas personas 
  // vienen en el boleto
}

interface ServiceSearch{ //Respuesta de la API, solo llegaran en base al servicio, fecha y horario que se escoja
  // Si es un servicio mirabus este campo vendra y sabremos como armar el bus que contiene los boletos
  buses?:BusService[]; //Lista de los buses que corresponden a la lista de Buses que van a salir
  boletos:BoletosService[];//Si no viene la lista de buses entonces, no es mirabus y agrupamos por defecto
}

// --- Interfaces para el componente ---
interface ServiceInfo {
  id: string;
  name: string;
  schedules: string[];
}

export default function AgrupacionBoletos() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<ServiceSearch | null>(null);

  // Carga inicial de la lista de servicios para los filtros
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesData = await apiGet<ServiceInfo[]>('/manage/mirabus-services',{handle401:true,redirectPath:'/core-tacana-wits-7b345/'});
        setServices(servicesData);
      } catch (err) {
        setError("No se pudo cargar la lista de servicios.");
      }
    };
    fetchServices();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearchResult(null);

    const params = new URLSearchParams({
      servicio: selectedService,
      fecha: selectedDate,
      horario: selectedSchedule,
    });

    try {
      // --- MOCK DATA ---
      await new Promise(resolve => setTimeout(resolve, 800)); // Simular red
      let result: ServiceSearch;
      if (selectedService === 'mirabus_city_tour') {
        // Mock para un servicio tipo Mirabus
        result = {
          buses: [
            {
              orderBus: 'B-01',
              distribution: [
                { id: 1, x: 1, y: 1 }, { id: 2, x: 2, y: 1 }, { id: 3, x: 4, y: 1 }, { id: 4, x: 5, y: 1 },
                { id: 5, x: 1, y: 2 }, { id: 6, x: 2, y: 2 }, { id: 7, x: 4, y: 2 }, { id: 8, x: 5, y: 2 },
                { id: 9, x: 1, y: 3 }, { id: 10, x: 2, y: 3 }, { id: 11, x: 4, y: 3 }, { id: 12, x: 5, y: 3 },
              ]
            },
            {
              orderBus: 'B-02',
              distribution: [
                { id: 1, x: 1, y: 1 }, { id: 2, x: 2, y: 1 }, { id: 3, x: 4, y: 1 }, { id: 4, x: 5, y: 1 },
                { id: 5, x: 1, y: 2 }, { id: 6, x: 2, y: 2 }, { id: 7, x: 4, y: 2 }, { id: 8, x: 5, y: 2 },
                { id: 9, x: 1, y: 3 }, { id: 10, x: 2, y: 3 }, { id: 11, x: 4, y: 3 }, { id: 12, x: 5, y: 3 },
              ]
            }
          ],
          boletos: [
            { nombre: 'Familia García', peopleCount: 2, orderBus: 'B-01', idSeat: ['1', '2'] },
            { nombre: 'Juan Pérez', peopleCount: 1, orderBus: 'B-01', idSeat: ['5'] },
            { nombre: 'Grupo Amigos', peopleCount: 3, orderBus: 'B-01', idSeat: ['3', '4', '7'] },
            { nombre: 'Lucía Fernández', peopleCount: 1, orderBus: 'B-01', idSeat: ['10'] },
            { nombre: 'Grupo Otros', peopleCount: 3, orderBus: 'B-02', idSeat: ['3', '4', '7'] },
            { nombre: 'Pepito', peopleCount: 1, orderBus: 'B-02', idSeat: ['10'] },
          ]
        };
      } else {
        // Mock para un servicio normal
        result = {
          boletos: [
            { nombre: 'Carlos Mendoza', peopleCount: 4 },
            { nombre: 'Ana Torres', peopleCount: 2 },
            { nombre: 'Grupo Aventura', peopleCount: 8 },
            { nombre: 'Pareja Viajera', peopleCount: 2 },
            { nombre: 'Explorador Solitario', peopleCount: 1 },
            { nombre: 'Familia Soto', peopleCount: 5 },
          ]
        };
      }
      // --- FIN MOCK DATA ---
      setSearchResult(result);
      // const result = await apiGet<ServiceSearch>(`/manage/tours-clients?${params.toString()}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al buscar la agrupación.");
      }
    } finally {
      setLoading(false);
    }
  };

  const availableSchedules = useMemo(() => {
    if (!selectedService) return [];
    const service = services.find(s => s.id === selectedService);
    return service?.schedules || [];
  }, [selectedService, services]);

  useEffect(() => {
    if (selectedSchedule && !availableSchedules.includes(selectedSchedule)) {
      setSelectedSchedule('');
    }
  }, [selectedService, selectedSchedule, availableSchedules]);

  const isFormValid = selectedService && selectedDate && selectedSchedule;

  return (
    <div>
      {/* Panel de Filtros Obligatorios */}
      <div className="p-4 border rounded-lg bg-gray-50 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <select value={selectedService} onChange={e => setSelectedService(e.target.value)} className="w-full p-2 border rounded-md">
            <option value="">-- Seleccione Servicio --</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-2 border rounded-md" />
          <select value={selectedSchedule} onChange={e => setSelectedSchedule(e.target.value)} disabled={!selectedService} className="w-full p-2 border rounded-md disabled:bg-gray-200">
            <option value="">-- Seleccione Horario --</option>
            {availableSchedules.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button onClick={handleSearch} disabled={!isFormValid || loading} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            {loading ? 'Buscando...' : 'Generar Planilla'}
          </button>
        </div>
        {!isFormValid && <p className="text-xs text-gray-500 mt-2">Todos los campos son obligatorios para generar la planilla.</p>}
      </div>

      {/* Área de Resultados */}
      <div className="mt-8">
        {error && <p className="text-red-500">{error}</p>}
        {!searchResult && !loading && !error && (
          <div className="text-center p-8 bg-gray-100 rounded-lg">
            <p className="text-gray-600">Seleccione los filtros para ver la agrupación de pasajeros.</p>
          </div>
        )}
        {searchResult && (
          searchResult.buses ? <MirabusGroupingView result={searchResult} /> : <NormalTourGroupingView result={searchResult} />
        )}
      </div>
    </div>
  );
}

// --- Componente para renderizar la agrupación de MIRABUS ---
function MirabusGroupingView({ result }: { result: ServiceSearch }) {
  const { buses, boletos } = result;
  if (!buses) return null;

  // Mapea los asientos a los nombres de los pasajeros para un acceso rápido
  const seatToPassengerMap = new Map<string, string>();
  boletos.forEach(boleto => {
    boleto.idSeat?.forEach(seatId => {
      seatToPassengerMap.set(`${boleto.orderBus}-${seatId}`, boleto.nombre);
    });
  });

  return (
    <div className="space-y-8">
      {buses.map(bus => {
        const grid = Array(Math.max(...bus.distribution.map(s => s.y))).fill(null)
          .map(() => Array(Math.max(...bus.distribution.map(s => s.x))).fill(null));
        bus.distribution.forEach(seat => { grid[seat.y - 1][seat.x - 1] = seat; });

        return (
          <div key={bus.orderBus} className="p-4 border rounded-lg">
            <h3 className="text-xl font-bold mb-4">Bus: {bus.orderBus}</h3>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))` }}>
              {grid.map((row, y) => row.map((seat, x) => {
                const passengerName = seat ? seatToPassengerMap.get(`${bus.orderBus}-${seat.id}`) : undefined;
                return (
                  <div key={`${x}-${y}`} className={`h-20 border rounded flex flex-col items-center justify-center p-1 text-center ${passengerName ? 'bg-blue-200' : 'bg-gray-100'}`}>
                    {seat && (
                      <>
                        <span className="font-bold text-sm">Asiento {seat.id}</span>
                        {passengerName && <span className="text-xs text-blue-800 mt-1">{passengerName}</span>}
                      </>
                    )}
                  </div>
                );
              }))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// --- Componente para renderizar la agrupación de TOURS NORMALES ---
function NormalTourGroupingView({ result }: { result: ServiceSearch }) {
  const { boletos } = result;
  const VEHICLE_CAPACITIES = [15, 10, 6]; // Capacidades disponibles

  const groupedBoletos = useMemo(() => {
    const sortedBoletos = [...boletos].sort((a, b) => b.peopleCount - a.peopleCount);
    const vehicles: { capacity: number; passengers: BoletosService[]; currentLoad: number }[] = [];

    sortedBoletos.forEach(boleto => {
      let assigned = false;
      // Intenta asignar al primer vehículo existente con espacio
      for (const vehicle of vehicles) {
        if (vehicle.currentLoad + boleto.peopleCount <= vehicle.capacity) {
          vehicle.passengers.push(boleto);
          vehicle.currentLoad += boleto.peopleCount;
          assigned = true;
          break;
        }
      }
      // Si no se pudo asignar, abre un nuevo vehículo
      if (!assigned) {
        vehicles.push({
          capacity: VEHICLE_CAPACITIES[0], // Abre un vehículo del tamaño más grande
          passengers: [boleto],
          currentLoad: boleto.peopleCount,
        });
      }
    });
    return vehicles;
  }, [boletos]);

  return (
    <div className="space-y-6">
      {groupedBoletos.map((vehicle, index) => (
        <div key={index} className="p-4 border rounded-lg bg-white shadow">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">
            Vehículo {index + 1} - Ocupación: {vehicle.currentLoad}/{vehicle.capacity}
          </h3>
          <ul className="space-y-2">
            {vehicle.passengers.map((p, pIndex) => (
              <li key={pIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium text-gray-900">{p.nombre}</span>
                <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                  {p.peopleCount} persona{p.peopleCount > 1 ? 's' : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}