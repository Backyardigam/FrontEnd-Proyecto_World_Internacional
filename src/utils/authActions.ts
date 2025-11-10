import { apiPost } from "./apiClient";
import { $auth } from "./authStore";
import type { User } from "./auth";

const USER_STORAGE_KEY = 'app_user_data';

/**
 * Inicia la sesión del usuario.
 * @param email 
 * @param password 
 */
export const loginUser = async (email: string, password: string) => {
  // La lógica de la llamada a la API ahora vive aquí.
  const { user } = await apiPost<{ user: User }>("/auth/login", { email, password });
  
  // Guardamos los datos del usuario en localStorage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  
  // Actualizamos la tienda global, que notificará a todos los componentes.
  $auth.set({ isAuthenticated: true, user, loading: false });
};

/**
 * Cierra la sesión del usuario.
 * Esta función puede ser llamada desde cualquier parte de la aplicación.
 */
export const logoutUser = async () => {
  try {
    // Llama al endpoint del backend para invalidar la sesión/cookie.
    await apiPost("/auth/logout", {});
  } catch (error) {
    console.error("Error durante el logout, se procederá a limpiar localmente:", error);
  } finally {
    // Independientemente de si el backend falló, limpiamos el estado del cliente.
    localStorage.removeItem(USER_STORAGE_KEY);
    // Actualizamos la tienda global, lo que notificará a todos los componentes suscritos.
    $auth.set({ isAuthenticated: false, user: null, loading: false });
  }
};