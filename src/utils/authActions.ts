import { apiGet, apiPost } from "./apiClient";
import { $auth } from "./authStore";
import type { User, RegisterPayload } from "./auth";

const USER_STORAGE_KEY = 'app_user_data';

/**
 * Inicia la sesión del usuario.
 * @param email 
 * @param password 
 */
export const loginUser = async (email: string, password: string) => {
  // 1. Inicia sesión, el backend establece la cookie.
  await apiPost<{ user: User }>("/auth/login", { email, password });
  const user = await apiGet<User>("/profile/")
  // Guardamos los datos del usuario en localStorage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  
  // Actualizamos la tienda global, que notificará a todos los componentes.
  $auth.set({ isAuthenticated: true, user , loading: false });
};

/**
 * Actualiza los datos del perfil del usuario.
 * @param updatedData - Los nuevos datos del usuario.
 */
export const updateUserProfile = async (updatedData: Partial<User>) => {
  // 1. Envía los datos actualizados al backend.
  // El backend debería devolver el objeto de usuario completo y actualizado.
  const updatedUser = await apiPost<User>("/profile/", updatedData);

  // 2. Actualiza los datos en localStorage.
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

  // 3. Actualiza la tienda global para que toda la UI refleje los cambios.
  // $auth.setKey('user', updatedUser);
  return updatedUser;
};

/**
 * Crea una sesión de invitado.
 * Llama a un endpoint que establece una cookie de sesión para invitados
 * y devuelve un objeto de usuario temporal.
 */
export const continueAsGuest = async () => {
  // 1. Llama al endpoint del backend. Este solo establece la cookie de sesión
  //    y no devuelve contenido en el cuerpo de la respuesta.
  await apiPost("/auth/guest", {});

  // 2. Como la llamada fue exitosa, creamos el objeto de usuario invitado en el frontend.
  const user: User = {
    name: 'Invitado',
    phoneNumber: null,
    email: null,
    avatar: null,
    rol: 'guest',
  };

  // 3. Guarda el objeto de usuario en localStorage.
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  // 4. Actualiza la tienda global para reflejar el nuevo estado.
  $auth.set({ isAuthenticated: true, user, loading: false });
};

/**
 * Paso 1 del registro: Envía los datos del usuario al backend.
 * El backend se encargará de enviar el código de verificación por email.
 * Esta función no inicia sesión, solo inicia el proceso.
 * @param payload - Datos del formulario de registro.
 */
export const registerUser = async (payload: RegisterPayload) => {
  // Llama al endpoint de registro. Si hay un error (ej: email ya existe),
  // apiPost lo lanzará y será capturado en el componente.
  await apiPost("/auth/register", payload);
};

/**
 * Paso 2 del registro: Verifica el código y finaliza la sesión.
 * @param email - El email del usuario que se está registrando.
 * @param code - El código de verificación recibido por email.
 */
export const verifyAndLoginUser = async (email: string, code: string) => {
  // 1. Envía el email y el código para verificación. El backend establecerá la cookie de sesión.
  await apiPost("/auth/verify", { email, code }); 

  // 2. Con la cookie ya establecida, pedimos los datos completos del perfil.
  const user = await apiGet<User>("/profile/");

  // 3. Si todo es correcto, guardamos los datos y actualizamos el estado global.
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  $auth.set({ isAuthenticated: true, user, loading: false });

  // 4. El componente se encargará de la redirección.
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
  // Reutilizamos la acción de reenviar código con el propósito 'resetPassword'.
  await apiPost("/auth/forgot-password",{email})
};

/**
 * Paso 2 de recuperación: Verifica que el código ingresado es válido.
 * @param email El email del usuario.
 * @param code El código recibido.
 */
export const verifyResetCode = async (email: string, code: string) => {
  // Este endpoint solo valida el código. No establece sesión.
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
  try {
    await apiPost("/auth/logout", {});
  } catch (error) {
    console.error("Error durante el logout, se procederá a limpiar localmente:", error);
  } finally {
    localStorage.removeItem(USER_STORAGE_KEY);
    $auth.set({ isAuthenticated: false, user: null, loading: false });
  }
};