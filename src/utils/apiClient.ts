import { isBrowser } from "./environment";

export interface AuthenticatedFetchOptions extends RequestInit {
  handle401?: boolean;
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
  const { handle401 = true, ...fetchOptions } = options;
  const fullUrl = `${import.meta.env.PUBLIC_API_URL || ''}${url}`;
  const response = await fetch(fullUrl, {
    ...fetchOptions,
    credentials: 'include',
  });

  if (response.status === 401 && handle401) {
    console.error('Error 401: No autorizado. Redirigiendo a /login...');
    if (isBrowser) {
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?session_expired=true&redirect=${encodeURIComponent(currentPath)}`;
    }
    return new Promise(() => {});
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
    let errorDetails = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetails = errorData.message || JSON.stringify(errorData);
    } catch (e) {
    }
    throw new Error(errorDetails);
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
    let errorDetails = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetails = errorData.message || JSON.stringify(errorData);
    } catch (e) {
    }
    throw new Error(errorDetails);
  }

  return response.json() as Promise<T>;
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
    let errorDetails = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetails = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // Si el cuerpo del error no es JSON o está vacío, el error original se mantiene.
    }
    throw new Error(errorDetails);
  }

  return response.json() as Promise<T>;
}
