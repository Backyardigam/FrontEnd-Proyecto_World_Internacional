import { atom } from 'nanostores';
// Importar las interfaces compartidas
import type { AuthState } from '../utils/auth';

// Crea la tienda (el "átomo" de estado) con un estado inicial.
// El prefijo '$' es una convención común para las tiendas.
export const $auth = atom<AuthState>({
  isAuthenticated: false,
  user: null,
  loading: true, // Inicia en true, igual que el AuthProvider
});