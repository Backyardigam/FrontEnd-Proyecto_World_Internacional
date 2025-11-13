/**
 * Este archivo contiene las definiciones de tipos compartidas
 * para la autenticación en toda la aplicación.
 * Basicamente los datos del usuario y si el usuario existe.
 */
export interface User {
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  rol: 'guest'|'user'; // |admin|employee|superadmin Rol del usuario que se registro 
}

/**
 * El estado de la autenticacion indica si hay un usuario registrado
 * o si esta en proceso de ser auntenticado
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

/**
 * Datos que se envian para registrar al usuario
 */


export interface RegisterPayload {
  // fullName: string;
  // phoneNumber: string;
  email: string;
  password: string;
}