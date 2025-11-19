import { apiGet } from "../../../utils/apiClient";

export interface MediaFiles {
  urlBG1: string;
  urlBG2: string;
  urlGallery: string[];
  urlTrip: string;
}

export interface Schedule {
  [key: string]: {
    startTrip: string;
    endTrip: string;
  };
}

/**
 * Representa los datos de contenido de un servicio, separados de sus identificadores.
 */
export interface ServiceContent {
  name: string;
  cost: string;
  type: "tour" | "mirabus";
  tag: string[];
  fullDescription: string;
  itinerary: string[];
  recomendations: string[];
  additional: string[];
  schedule: Schedule;
  mediaFiles: MediaFiles;
}

/**
 * La estructura final y organizada de un servicio, combinando identificadores y contenido.
 * Esta es la interfaz que usarán tus componentes de Astro.
 */
export interface ServiceDetails {
  id: string;
  id_name: string;
  data: ServiceContent;
}

/**
 * Representa la estructura de datos "plana" tal como viene de la API /services/all.
 */
interface ApiService {
  id: string;
  id_name: string;
  name: string;
  cost: string;
  type: "tour" | "mirabus";
  tag: string[];
  fullDescription: string;
  itinerary: string[];
  recomendations: string[];
  additional: string[];
  schedule: Schedule;
  mediaFiles: MediaFiles; // La API devolverá el objeto MediaFiles estructurado.
}

/**
 * Transforma un objeto de servicio de la API a la estructura ServiceDetails deseada.
 * @param apiService El objeto plano recibido de la API.
 * @returns Un objeto con la estructura ServiceDetails.
 */
function transformApiService(apiService: ApiService): ServiceDetails {
  // Ahora que la API devuelve la estructura correcta, la transformación es más simple.
  const { id, id_name, ...content } = apiService;

  return {
    id,
    id_name,
    data: {
      ...content,
    },
  };
}

// Cache en memoria para evitar múltiples llamadas durante el build
let cachedServices: ServiceDetails[];

export async function getAllServices(): Promise<ServiceDetails[]> {
  if (cachedServices) {
    return cachedServices;
  }
  const apiServices = await apiGet<ApiService[]>("/services/all");
  // Transformamos los datos de la API a nuestra estructura ideal y los cacheamos.
  cachedServices = apiServices.map(transformApiService);
  return cachedServices;
}
