import type { IVehicleListItem, IVehicleDetail } from '../admin_utils/mirabusAdmin';

// Nuestra "base de datos" en memoria para las plantillas de vehículos.
let mockVehicles: IVehicleDetail[] = [
  {
    id: 1,
    name: 'Bus Fantasma (Por Defecto)',
    seatCount: 36,
    isDefaultGhost: true,
    seatDistribution: Array.from({ length: 36 }, (_, i) => ({
      id: i + 1,
      x: (i % 4) + 1,
      y: Math.floor(i / 4) + 1,
    })),
  },
  {
    id: 2,
    name: 'Bus Panorámico Real',
    seatCount: 45,
    isDefaultGhost: false,
    seatDistribution: Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      x: (i % 4) + 1,
      y: Math.floor(i / 4) + 1,
    })),
  },
  {
    id: 3,
    name: 'Minibus Sprinter',
    seatCount: 20,
    isDefaultGhost: false,
    seatDistribution: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      x: (i % 4) + 1,
      y: Math.floor(i / 4) + 1,
    })),
  },
];

// Función para obtener una copia de la lista (para evitar mutaciones directas)
export const getMockVehicles = (): IVehicleDetail[] => JSON.parse(JSON.stringify(mockVehicles));

// Función para actualizar la lista (simulando un POST, PUT, DELETE)
export const setMockVehicles = (newVehicles: IVehicleDetail[]) => {
  mockVehicles = JSON.parse(JSON.stringify(newVehicles));
};