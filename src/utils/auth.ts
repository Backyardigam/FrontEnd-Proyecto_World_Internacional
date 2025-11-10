/**
 * Este archivo contiene las definiciones de tipos compartidas
 * para la autenticación en toda la aplicación.
 * Basicamente los datos del usuario y si el usuario existe.
 */

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  avatarURL: string | null;
  rol: 'guest'|'user'; // |admin|employee|superadmin Rol del usuario que se registro 
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}