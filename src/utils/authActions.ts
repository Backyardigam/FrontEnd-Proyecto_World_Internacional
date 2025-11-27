import { apiGet, apiPost, apiPut, type AuthenticatedFetchOptions } from "./apiClient";
import { $auth } from "./authStore";
import type { User, RegisterPayload } from "./auth";

const USER_STORAGE_KEY = 'app_user_data';

/**
 * Inicia la sesion del usuario.
 * @param email 
 * @param password 
 */
export const loginUser = async (email: string, password: string, options: AuthenticatedFetchOptions = {}) => {
  await apiPost<{ user: User }>("/auth/login", { email, password }, options);
  const user = await apiGet<User>("/profile/", { cache: 'no-store' });
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  
  $auth.set({ isAuthenticated: true, user , loading: false });
};

/**
 * Inicia sesión y verifica si el usuario tiene permisos de administrador.
 * Este es el método de login seguro para el panel de administración.
 * @param email 
 * @param password 
 */
export const loginAdminUser = async (email: string, password: string) => {
  await loginUser(email, password);
  try {
    await apiGet("/admin/login", { cache: 'no-store' });
  } catch (error: any) {
    await logoutUser();
    throw new Error("No tienes los permisos necesarios para acceder a este panel.");
  }
  localStorage.setItem(USER_STORAGE_KEY, "");
  
  $auth.set({ isAuthenticated: true, user : null , loading: false });
};

/**
 * Actualiza los datos del perfil del usuario.
 * @param updatedData - Los nuevos datos del usuario.
 */
export const updateUserProfile = async (updatedData: Partial<User>) => {
  const updatedUser = await apiPut<User>("/profile/", updatedData);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  
  const currentState = $auth.get();
  $auth.set({ ...currentState, user: updatedUser });

  return updatedUser;
};

/**
 * Crea una sesión de invitado.
 * Llama a un endpoint que establece una cookie de sesión para invitados
 * y devuelve un objeto de usuario temporal.
 */
export const continueAsGuest = async () => {
  await apiPost("/auth/guest", {});

  const user: User = {
    name: 'Invitado',
    phoneNumber: null,
    email: null,
    avatar: null,
    role: 'guest',
  };

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  $auth.set({ isAuthenticated: true, user, loading: false });
};

/**
 * Paso 1 del registro: Envía los datos del usuario al backend.
 * El backend se encargará de enviar el código de verificación por email.
 * Esta función no inicia sesión, solo inicia el proceso.
 * @param payload - Datos del formulario de registro.
 */
export const registerUser = async (payload: RegisterPayload) => {
  await apiPost("/auth/register", payload);
};

/**
 * Paso 2 del registro: Verifica el código y finaliza la sesión.
 * @param email - El email del usuario que se está registrando.
 * @param code - El código de verificación recibido por email.
 */
export const verifyAndLoginUser = async (email: string, code: string) => {
  await apiPost("/auth/verify", { email, code }); 

  const user = await apiGet<User>("/profile/");

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  $auth.set({ isAuthenticated: true, user, loading: false });
};

/**
 * Solicita al backend que reenvíe un código de verificación.
 * @param email - El email del usuario.
 * @param purpose - El propósito del código ('register' o 'resetPassword').
 */
export const resendVerificationCode = async (email: string, purpose: 'register' | 'resetPassword') : Promise<void>=> {
  await apiPost("/auth/resend-code", { email, purpose });
};

/**
 * Paso 1 de recuperación: Solicita un código para restablecer la contraseña.
 * @param email El email del usuario.
 */
export const requestPasswordReset = async (email: string) => {
  await apiPost("/auth/forgot-password",{email})
};

/**
 * Paso 2 de recuperación: Verifica que el código ingresado es válido.
 * Esta funcion solo verifica el codigo, luego de la validacion puede dar la instruccion
 * para el cambio de contraseña
 * @param email El email del usuario.
 * @param code El código recibido.
 */
export const verifyResetCode = async (email: string, code: string) => {
  await apiPost("/auth/verify-reset-code", { email, code });
};

/**
 * Paso 3 de recuperación: Establece la nueva contraseña.
 */
export const resetPassword = async (email: string, code: string, newPassword: string) => {
  await apiPost("/auth/reset-password", { email, code, newPassword });
};

/**
 * Cierra la sesión del usuario.
 * Esta función puede ser llamada desde cualquier parte de la aplicación.
 */
export const logoutUser = async () => {
  // La limpieza del estado local y de la tienda debe ocurrir siempre,
  // independientemente de si la llamada a la API tiene éxito o no.
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('cart'); // Buena práctica: limpiar también el carrito.
  $auth.set({ isAuthenticated: false, user: null, loading: false });

  try {
    await apiPost("/auth/logout", {});
  } catch (error) {
    // Si la API falla, el usuario ya está deslogueado en el frontend.
    console.error("La llamada a /auth/logout falló, pero el cliente ya ha sido limpiado.", error);
  }
};