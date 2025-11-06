import React from 'react';
import { AuthProvider } from '../utils/authContext';

/**El propósito de este contenedor es únicamente proveer el contexto.
 * Brinda las herramientas para manejar las sesiones
 */
export default function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
