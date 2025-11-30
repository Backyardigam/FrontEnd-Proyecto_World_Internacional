/**
 * Este archivo define las interfaces (payloads) para la gestión de Mirabuses
 * en el panel de administración. Se divide en dos secciones principales:
 * 1. Gestión de Plantillas de Vehículos (CRUD del modelo `Vehicle`).
 * 2. Asignación de Viajes (Creación de `Mirabus` y `MirabusSeat`).
 */

// --- 1. GESTIÓN DE PLANTILLAS DE VEHÍCULOS ---

/**
 * Representa la estructura de la distribución de asientos que se guardará en el JSON.
 * Cada asiento tiene un número y coordenadas para su renderizado.
 */
export interface ISeatDistributionItem {
  id: number; // Representa el número del asiento (ej: 1, 2, 3...)
  x: number;
  y: number;
}

/**
 * Payload para CREAR un nuevo vehículo (plantilla).
 * POST /manage/mirabus
 * Coincide con los campos del modelo `Vehicle` de Prisma.
 */
export interface IVehicleCreatePayload {
  name: string;
  seatCount: number;
  seatDistribution: ISeatDistributionItem[];
  isDefaultGhost?: boolean; // Para marcar la plantilla fantasma
}

/**
 * Payload para ACTUALIZAR un vehículo existente.
 * PUT /manage/mirabus/vehicle/:id
 * Todos los campos son opcionales. El backend espera que los campos no modificados
 * se envíen como `null` o no se incluyan.
 */
export type IVehicleUpdatePayload = Partial<IVehicleCreatePayload>;

/**
 * Representa un vehículo en la lista general.
 * GET /manage/mirabus
 * Es una versión ligera, sin la pesada distribución de asientos.
 */
export interface IVehicleListItem {
  id: number;
  name: string;
  seatCount: number;
  isDefaultGhost?: boolean; // <-- NUEVO: Útil para mostrar un ícono o etiqueta en la lista
}

/**
 * Representa el detalle completo de un vehículo, para la vista de edición.
 * GET /manage/mirabus/vehicle/:id
 */
export interface IVehicleDetail extends IVehicleListItem {
  seatDistribution: ISeatDistributionItem[];
}


// --- 2. ASIGNACIÓN DE VIAJES ---

/**
 * Representa la asignación de una plantilla de vehículo a un orden específico en un viaje.
 * Ej: "El primer bus (orden 'A') será un 'Bus Panorámico' (vehicleId: 1)".
 */
export interface IBusAssignment {
  busOrder: string; // Ej: "A", "B", "1", "2"
  vehicleId: number; // ID de la plantilla de `Vehicle` a usar.
}

/**
 * Payload para ASIGNAR vehículos a un servicio en una fecha y horario específicos.
 * Esto disparará la creación de un `Mirabus` y sus `MirabusSeat` en el backend.
 * POST /manage/mirabus/assign-trip (Ruta sugerida)
 */
export interface IAssignTripPayload {
  serviceId: string; // ID del servicio (ej: "Mirabus City Tour")
  date: string;      // Formato "YYYY-MM-DD"
  schedule: string;  // Formato "HH:MM" (24h)
  assignments: IBusAssignment[]; // Lista de buses y las plantillas que usarán.
  // Si `assignments` está vacío, el backend debe usar el bus fantasma por defecto.
}

/**
 * Payload para ACTUALIZAR la asignación de un viaje existente.
 * Ej: Cambiar del bus fantasma a uno real.
 * PUT /manage/mirabus/assign-trip/{mirabusId} (Ruta sugerida)
 */
export interface IUpdateTripAssignmentPayload {
  // Se envía la nueva lista de asignaciones. El backend se encarga de la lógica
  // de reasignar asientos existentes y crear los nuevos si la capacidad aumenta.
  assignments: IBusAssignment[];
}