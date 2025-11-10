import React, { createContext, useContext, useState, useEffect } from "react";
// 1. Importar la tienda de Nanostores
import { $auth } from "./authStore";
// Importar las interfaces compartidas
import type { User, AuthState } from "../utils/auth";

interface AuthContextType {
  auth: AuthState;
  renderWhenReady: (children: React.ReactNode) => React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider principal

const USER_STORAGE_KEY = 'app_user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // El estado inicial ahora se lee directamente de la tienda global.
  // El script de inicialización ya se encargó de poner el valor correcto.
  const [auth, setAuth] = useState<AuthState>($auth.get());
  
  // --------- SINCRONIZAR CON LA TIENDA GLOBAL ----------
  useEffect(() => {
    // Nos suscribimos a los cambios en la tienda global.
    // Si `logoutUser` se llama desde `SesionButton`, este `AuthProvider` se enterará
    // y actualizará su propio estado para que los componentes hijos (como FormularioMirabus) reaccionen.
    const unsubscribe = $auth.subscribe(newState => {
      setAuth(newState);
    });
    return () => unsubscribe(); // Limpiamos la suscripción al desmontar.
  }, []);

  /**
   * Una función helper para renderizar componentes solo cuando la sesión
   * ha sido verificada. Muestra null (o un loader) mientras tanto.
   */
  const renderWhenReady = (children: React.ReactNode): React.ReactNode => {
    if (auth.loading) {
      return null; // O podrías retornar <Spinner />
    }
    return children;
  };

  return (
    <AuthContext.Provider value={{ auth, renderWhenReady }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
