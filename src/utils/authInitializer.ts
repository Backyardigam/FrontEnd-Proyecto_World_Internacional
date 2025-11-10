import { apiGet } from "./apiClient";
import { $auth } from "./authStore";
import type { User } from "./auth";

const USER_STORAGE_KEY = 'app_user_data';

/**
 * Esta función se ejecuta en el lado del cliente en cada carga de página.
 * Su único propósito es verificar si existe una sesión válida y actualizar
 * la tienda global de Nanostores ($auth) en consecuencia.
 */
async function initializeAuthStore() {
  const storedUserJSON = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedUserJSON) {
    // No hay usuario en localStorage, la sesión no está iniciada.
    $auth.set({ isAuthenticated: false, user: null, loading: false });
    return;
  }

  try {
    // Validamos la sesión con el backend.
    await apiGet("/auth/check");
    const user = JSON.parse(storedUserJSON) as User;
    $auth.set({ isAuthenticated: true, user, loading: false });
  } catch (error) {
    // El token no es válido, limpiamos todo.
    localStorage.removeItem(USER_STORAGE_KEY);
    $auth.set({ isAuthenticated: false, user: null, loading: false });
  }
}

initializeAuthStore();