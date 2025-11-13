import React from 'react';
import { AuthProvider } from '../../utils/authContext';
import FormularioMirabus from './servicio_mirabus/FormularioMirabus';

/**
 * Este componente actúa como la "pagina" completa de React.
 * Envuelve el formulario con el proveedor de autenticación, asegurando
 * que el contexto este disponible para todos sus hijos.
 */
export default function MirabusPage() {
  return (
    <AuthProvider>
      <FormularioMirabus />
    </AuthProvider>
  );
}