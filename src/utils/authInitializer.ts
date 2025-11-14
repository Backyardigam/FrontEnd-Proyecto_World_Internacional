import { apiGet } from "./apiClient";
import { $auth } from "./authStore";
import { isBrowser } from "./environment";
import type { User } from "./auth";

const USER_STORAGE_KEY = 'app_user_data';

/**
 * Esta función se ejecuta en el lado del cliente en cada carga de pagina.
 * Su unico proposito es verificar si existe una sesion valida y actualizar
 * la tienda global de Nanostores ($auth) en consecuencia
 */
async function initializeAuthStore() {
  const storedUserJSON = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUserJSON) {
    $auth.set({ isAuthenticated: false, user: null, loading: false });
    return;
  }

  try {
    // Usamos `cache: 'no-store'` para asegurarnos de que siempre obtenemos una respuesta
    // fresca del servidor y no una respuesta en caché que podría ser incorrecta
    // (ej. un 401 cacheado de antes de iniciar sesión).
    // `handle401: false` sigue siendo crucial para evitar el bucle de redirección.
    await apiGet("/auth/check-session", { handle401: false, cache: 'no-store' });
    const user = JSON.parse(storedUserJSON) as User;
    $auth.set({ isAuthenticated: true, user, loading: false });

  } catch (error) {
    localStorage.removeItem(USER_STORAGE_KEY);
    $auth.set({ isAuthenticated: false, user: null, loading: false });
  }
}

if (isBrowser) {
  initializeAuthStore();
}