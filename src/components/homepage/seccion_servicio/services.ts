import { apiGet } from "../../../utils/apiClient";

export interface MediaFiles {
  urlBg1?: string;
  urlBg2?: string;
  urlGalery?: string[];
  urlTrip?: string;
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
  mediaFiles: MediaFiles;
}

/**
 * Transforma un objeto de servicio de la API a la estructura ServiceDetails deseada.
 * @param apiService El objeto plano recibido de la API.
 * @returns Un objeto con la estructura ServiceDetails.
 */
function transformApiService(apiService: ApiService): ServiceDetails {
  const { id, id_name, ...content } = apiService;

  return {
    id,
    id_name,
    data: {
      ...content,
    },
  };
}

let cachedServices: ServiceDetails[];

//para mejorar el proceso en build retornamos lo mismo si ya existe(caché)
export async function getAllServices(): Promise<ServiceDetails[]> {
  if (cachedServices) {
    return cachedServices;
  }
  const apiServices = await apiGet<ApiService[]>("/services/all");
  cachedServices = apiServices.map(transformApiService);
  return cachedServices;
}
