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
  // La lógica de la llamada a la API ahora vive aquí.
  const { user } = await apiPost<{ user: User }>("/auth/login", { email, password });
  
  // Guardamos los datos del usuario en localStorage
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  
  // Actualizamos la tienda global, que notificará a todos los componentes.
  $auth.set({ isAuthenticated: true, user, loading: false });
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
    avatarURL: null,
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
  const user = await apiGet<User>("/auth/getProfile");

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