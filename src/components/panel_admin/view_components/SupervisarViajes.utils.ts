// Respuesta del filtro de servicios
export interface IServicesTypeMirabus {
  id: string;
  name: string;
  schedule: string[];
}

// Detalles de los asientos (dentro de la tabla)
export interface IMirabusItemDetail {
  busOrder: string;
  seatCount: number;
  seatsReserved: number;
}

// Estructura principal de la fila de la tabla
export interface IMirabusItem {
  id: string;
  serviceName: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  schedule: string; // HH:MM AM/PM
  mirabusSeat: IMirabusItemDetail[];
}

// Metadatos de paginación
export interface PaginationMeta {
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  limitePorPagina: number;
}

// Respuesta paginada genérica
export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// Estado para los filtros
export interface FilterState {
  serviceId: string;
  schedule: string;
  date: string;
  page: number;
  limit: number;
}

// Estructura de un vehículo en la lista
export interface IVehicleListItem {
  id: number;
  name: string;
  seatCount: number;
  // isDefaultGhost ?: boolean
}

// Estructura de un vehículo ya asignado
export interface IPreviousVehicles {
  busOrder: string;
  vehicleId: number;
  name: string;
  seatCount: number;
}

// Respuesta del API (GET)
export interface IResponseVehiclesList {
  assigned: IPreviousVehicles[];
  vehicles: IVehicleListItem[];
}

// Payload para guardar (PUT)
export interface IBusAssignment {
  busOrder: string;
  vehicleId: number;
}