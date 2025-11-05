/**
 * Un wrapper para la API fetch que maneja la autenticación automáticamente.
 * Añade el accessToken a las cabeceras y redirige a /login si la petición
 * devuelve un 401 (Unauthorized).
 *
 * @param url - La URL del endpoint, puede ser relativa (ej. '/api/reserve-trip').
 * @param options - Las opciones de fetch (method, body, etc.).
 * @returns Una promesa que resuelve con la respuesta de la API.
 * @throws Lanza un error si la petición falla por razones que no son 401.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fullUrl = `${import.meta.env.PUBLIC_API_URL || ''}${url}`;
  const response = await fetch(fullUrl, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    console.error('Error 401: No autorizado. Redirigiendo a /login...');
    window.location.href = '/login';
    // Devolvemos una promesa que nunca se resuelve para detener la ejecución del código que llamó a fetch.
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
export async function apiGet<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await authenticatedFetch(url, { ...options, method: 'GET' });

  if (!response.ok) {
    // Intenta obtener un mensaje de error del cuerpo de la respuesta
    let errorDetails = `Error HTTP: ${response.status}`;
    try {
      const errorData = await response.json();
      errorDetails = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // El cuerpo no es JSON o está vacío
    }
    throw new Error(errorDetails);
  }

  return response.json() as Promise<T>;
}

/**
 * Realiza una petición POST autenticada con un cuerpo JSON y parsea la respuesta JSON.
 * @param url La URL del endpoint.
 * @param body El objeto que se enviará como cuerpo de la petición.
 * @param options Opciones adicionales de fetch.
 * @returns Una promesa que resuelve con los datos JSON de la respuesta.
 * @throws Lanza un error si la respuesta no es 'ok'.
 */
export async function apiPost<T = any>(url: string, body: any, options: RequestInit = {}): Promise<T> {
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
      // El cuerpo no es JSON o está vacío
    }
    throw new Error(errorDetails);
  }

  return response.json() as Promise<T>;
}
