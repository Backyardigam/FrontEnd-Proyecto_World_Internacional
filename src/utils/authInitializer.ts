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