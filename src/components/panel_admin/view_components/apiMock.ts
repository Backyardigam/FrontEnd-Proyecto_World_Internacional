import { getMockVehicles, setMockVehicles } from './mockData';
import type { IVehicleListItem, IVehicleDetail, IVehicleCreatePayload } from '../admin_utils/mirabusAdmin';

const MOCK_DELAY = 500; // ms

/**
 * Simula una llamada a la API con un retraso.
 */
function mockApiCall<T>(data: T): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('%c[API MOCK]', 'color: orange; font-weight: bold;', 'Respondiendo con:', data);
      resolve(data);
    }, MOCK_DELAY);
  });
}

/**
 * Simula GET /manage/mirabus
 */
export const mockGetVehicles = (): Promise<IVehicleListItem[]> => {
  const vehicles = getMockVehicles();
  // La lista solo devuelve campos limitados, así que los mapeamos.
  const listItems: IVehicleListItem[] = vehicles.map(({ id, name, seatCount, isDefaultGhost }) => ({
    id,
    name,
    seatCount,
    isDefaultGhost,
  }));
  return mockApiCall(listItems);
};

/**
 * Simula GET /manage/mirabus/vehicle/:id
 */
export const mockGetVehicleById = (id: number): Promise<IVehicleDetail> => {
  const vehicle = getMockVehicles().find(v => v.id === id);
  if (!vehicle) {
    return Promise.reject({ status: 404, message: 'Vehículo no encontrado' });
  }
  return mockApiCall(vehicle);
};

/**
 * Simula POST /manage/mirabus
 */
export const mockCreateVehicle = (payload: IVehicleCreatePayload): Promise<IVehicleDetail> => {
  const currentVehicles = getMockVehicles();
  const newId = Math.max(...currentVehicles.map(v => v.id), 0) + 1;
  const newVehicle: IVehicleDetail = {
    id: newId,
    ...payload,
  };
  setMockVehicles([...currentVehicles, newVehicle]);
  return mockApiCall(newVehicle);
};

/**
 * Simula PUT /manage/mirabus/vehicle/:id
 */
export const mockUpdateVehicle = (id: number, payload: Partial<IVehicleCreatePayload>): Promise<IVehicleDetail> => {
  let updatedVehicle: IVehicleDetail | undefined;
  const updatedVehicles = getMockVehicles().map(v => {
    if (v.id === id) {
      updatedVehicle = { ...v, ...payload };
      return updatedVehicle;
    }
    return v;
  });
  setMockVehicles(updatedVehicles);
  return mockApiCall(updatedVehicle!);
};

/**
 * Simula DELETE /manage/mirabus/vehicle/:id
 */
export const mockDeleteVehicle = (id: number): Promise<{ success: true }> => {
  const filteredVehicles = getMockVehicles().filter(v => v.id !== id);
  setMockVehicles(filteredVehicles);
  return mockApiCall({ success: true });
};