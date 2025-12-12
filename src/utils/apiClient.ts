import { isBrowser } from "./environment";
import { addNotification } from "./notificationStore";

/**
 * Error personalizado para representar errores de la API.
 * Contiene el mensaje de error y el código de estado HTTP.
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
export interface AuthenticatedFetchOptions extends RequestInit {
  handle401?: boolean;
  redirectPath?: string;
  /**
   * Si se establece a 'notify', mostrará una notificación de error global en un error 403.
   * El error seguirá siendo lanzado para que el componente lo maneje.
   */
  handle403?: 'notify' | false;
}

/**
 * Un wrapper para la API fetch que maneja la autenticación automáticamente.
 * Incluye las credenciales (cookies) y opcionalmente redirige a /login si la petición
 * devuelve un 401 (Unauthorized).
 *
 * @param url - La URL del endpoint, puede ser relativa (ej. '/api/reserve-trip').
 * @param options - Las opciones de fetch (method, body, etc.).
 * @returns Una promesa que resuelve con la respuesta de la API.
 * @throws Lanza un error si la petición falla por razones que no son 401.
 */
export async function authenticatedFetch(
  url: string,
  options: AuthenticatedFetchOptions = {}
): Promise<Response> {
  const { handle401 = true, redirectPath = '/login', handle403 = false, ...fetchOptions } = options;
  const fullUrl = `${import.meta.env.PUBLIC_API_URL || ''}${url}`;
  const response = await fetch(fullUrl, {
    ...fetchOptions,
    credentials: 'include',
  });

  if (response.status === 401 && handle401) {
    console.error(`Error 401: No autorizado. Redirigiendo a ${redirectPath}...`);
    if (isBrowser) {
      const currentPath = window.location.pathname + window.location.search;
      // Mantenemos la lógica de `redirect` para el login de clientes, pero no para el de admin.
      const finalRedirectUrl = redirectPath === '/login'
        ? `${redirectPath}?session_expired=true&redirect=${encodeURIComponent(currentPath)}`
        : redirectPath;
      window.location.href = finalRedirectUrl;
    }
    return new Promise(() => {});
  }

  // Manejo centralizado de 403 (Forbidden)
  if (response.status === 403 && handle403 === 'notify') {
    let errorMessage = "No tienes permisos para realizar esta acción.";
    try {
      // Clonamos la respuesta para poder leer el cuerpo sin consumirlo.
      const errorData = await response.clone().json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error; // Usamos el mensaje de error del backend.
      }
    } catch (e) {
      // Si el cuerpo no es JSON o está vacío, usamos el mensaje por defecto.
    }
    addNotification(errorMessage, "error");

    // IMPORTANTE: Volvemos a lanzar el error para que el `catch` del componente pueda actuar.
    throw new ApiError(errorMessage, response.status);
  }

  return response;
}

// --- HELPER FUNCTIONS ---

/**
 * Realiza una petición GET autenticada y parsea la respuesta JSON.
 * @param url La URL del endpoint (relativa a la URL base de la API).
 * @param options Opciones adicionales de fetch.
 * @returns Una promesa que resuelve con los datos JSON.
 * @throws Lanza un error si la respuesta no es 'ok' (ej. 400, 500).
 */
export async function apiGet<T = any>(url: string, options: AuthenticatedFetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(url, { ...options, method: 'GET' });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      // Priorizamos 'message' (usuario) sobre 'error' (técnico) y aseguramos que sea string
      const msg = errorData.message || errorData.error;
      const finalMsg = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : `Error HTTP: ${response.status}`);
      throw new ApiError(finalMsg, response.status);
    } catch (e) {
      // Si la respuesta no es JSON, usamos el statusText que es más descriptivo.
      throw new ApiError(response.statusText || `Error HTTP: ${response.status}`, response.status);
    }
  }
  
  // Verificamos si la respuesta tiene contenido antes de intentar parsearla como JSON.
  // Un status 204 (No Content) o un header 'content-length' de 0 indican que no hay cuerpo.
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return Promise.resolve(undefined as T); // Devolvemos undefined si no hay JSON que parsear.
  }

  return response.json() as Promise<T>; // Solo parseamos si estamos seguros de que hay JSON.
}

/**
 * Realiza una petición POST autenticada con un cuerpo JSON y parsea la respuesta JSON.
 * @param url La URL del endpoint.
 * @param body El objeto que se enviará como cuerpo de la petición.
 * @param options Opciones adicionales de fetch.
 * @returns Una promesa que resuelve con los datos JSON de la respuesta.
 * @throws Lanza un error si la respuesta no es 'ok'.
 */
export async function apiPost<T = any>(url: string, body: any, options: AuthenticatedFetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const msg = errorData.message || errorData.error;
      const finalMsg = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : `Error HTTP: ${response.status}`);
      throw new ApiError(finalMsg, response.status);
    } catch (e) {
      // Si la respuesta no es JSON, usamos el statusText.
      throw new ApiError(response.statusText || `Error HTTP: ${response.status}`, response.status);
    }
  }
  
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return Promise.resolve(undefined as T);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}

/**
 * Realiza una petición PUT autenticada con un cuerpo JSON y parsea la respuesta JSON.
 * @param url La URL del endpoint.
 * @param body El objeto que se enviará como cuerpo de la petición.
 * @param options Opciones adicionales de fetch.
 * @returns Una promesa que resuelve con los datos JSON de la respuesta.
 * @throws Lanza un error si la respuesta no es 'ok'.
 */
export async function apiPut<T = any>(url: string, body: any, options: AuthenticatedFetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const msg = errorData.message || errorData.error;
      const finalMsg = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : `Error HTTP: ${response.status}`);
      throw new ApiError(finalMsg, response.status);
    } catch (e) {
      // Si la respuesta no es JSON, usamos el statusText.
      throw new ApiError(response.statusText || `Error HTTP: ${response.status}`, response.status);
    }
  }
  
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return Promise.resolve(undefined as T);
  }

  return response.json() as Promise<T>;
}

/**
 * Realiza una petición PATCH autenticada con un cuerpo JSON y parsea la respuesta JSON.
 * Ideal para actualizaciones parciales de un recurso.
 * @param url La URL del endpoint.
 * @param body El objeto con los campos a actualizar.
 * @param options Opciones adicionales de fetch.
 * @returns Una promesa que resuelve con los datos JSON de la respuesta.
 * @throws Lanza un error si la respuesta no es 'ok'.
 */
export async function apiPatch<T = any>(url: string, body: any, options: AuthenticatedFetchOptions = {}): Promise<T> {
  const response = await authenticatedFetch(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const msg = errorData.message || errorData.error;
      const finalMsg = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : `Error HTTP: ${response.status}`);
      throw new ApiError(finalMsg, response.status);
    } catch (e) {
      // Si la respuesta no es JSON, usamos el statusText.
      throw new ApiError(response.statusText || `Error HTTP: ${response.status}`, response.status);
    }
  }
  
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return Promise.resolve(undefined as T);
  }

  return response.json() as Promise<T>;
}

/**
 * Realiza una petición DELETE autenticada.
 * @param url La URL del endpoint del recurso a eliminar.
 * @param options Opciones adicionales de fetch.
 * @returns Una promesa que resuelve con los datos JSON de la respuesta (si los hay, ej. un mensaje de confirmación).
 * @throws Lanza un error si la respuesta no es 'ok'.
 */
export async function apiDelete<T = any>(url: string, body?: any, options: AuthenticatedFetchOptions = {}): Promise<T> {
  const fetchOptions: AuthenticatedFetchOptions = {
    ...options,
    method: 'DELETE',
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
  }

  const response = await authenticatedFetch(url, fetchOptions);

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const msg = errorData.message || errorData.error;
      const finalMsg = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : `Error HTTP: ${response.status}`);
      throw new ApiError(finalMsg, response.status);
    } catch (e) {
      // Si la respuesta no es JSON, usamos el statusText.
      throw new ApiError(response.statusText || `Error HTTP: ${response.status}`, response.status);
    }
  }
  
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return Promise.resolve(undefined as T);
  }

  return response.json() as Promise<T>;
}

/**
 * Realiza una petición POST/PUT autenticada con un cuerpo `multipart/form-data`.
 * Ideal para subir archivos junto con datos JSON.
 * @param url La URL del endpoint.
 * @param data El objeto de datos que se enviará como un campo JSON llamado 'data'.
 * @param files Un objeto donde las claves son el 'fieldname' y los valores son los archivos (File o File[]).
 * @param options Opciones adicionales de fetch, incluyendo el método ('POST' o 'PUT').
 * @returns Una promesa que resuelve con los datos JSON de la respuesta.
 * @throws Lanza un error si la respuesta no es 'ok'.
 */
export async function apiPostFormData<T = any>(url: string, data: any, files: Record<string, File | File[]>, options: AuthenticatedFetchOptions = {}): Promise<T> {
  const formData = new FormData();
  // 1. Añadir cada campo de los datos de texto por separado.
  // Esto coincide con la forma en que el backend (con Multer) espera recibir los campos.
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      // Los objetos complejos (como el array 'schedule' o 'mediaFiles') deben ser stringificados.
      if (typeof value === 'object' && value !== null) {
        formData.append(key, JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        // Los valores primitivos (string, number, boolean) se convierten a string.
        formData.append(key, String(value));
      }
    }
  }
  // 2. Añadir los archivos, cada uno con su 'fieldname' (nombre de campo).
  for (const fieldname in files) {
    const fileOrFiles = files[fieldname];
    if (Array.isArray(fileOrFiles)) {
      fileOrFiles.forEach(file => formData.append(fieldname, file));
    } else if (fileOrFiles) {
      formData.append(fieldname, fileOrFiles);
    }
  }

  // 3. Realizar la petición. No establecemos 'Content-Type', el navegador lo hará automáticamente para FormData.
  const response = await authenticatedFetch(url, { ...options, body: formData });

  if (!response.ok) {
    try {
      const errorData = await response.json();
      const msg = errorData.message || errorData.error;
      const finalMsg = typeof msg === 'string' ? msg : (msg ? JSON.stringify(msg) : `Error HTTP: ${response.status}`);
      throw new ApiError(finalMsg, response.status);
    } catch (e) {
      // Si la respuesta no es JSON, usamos el statusText.
      throw new ApiError(response.statusText || `Error HTTP: ${response.status}`, response.status);
    }
  }

  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return Promise.resolve(undefined as T);
  }

  return response.json() as Promise<T>;
}
