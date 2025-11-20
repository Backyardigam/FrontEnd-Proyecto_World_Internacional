import React, { createContext, useContext, useState, useEffect } from "react";
import { $auth } from "./authStore";
import type { User, AuthState } from "../utils/auth";

export interface AuthContextType {
  auth: AuthState;
  renderWhenReady: (children: React.ReactNode) => React.ReactNode;
  
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const USER_STORAGE_KEY = "app_user_data";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [auth, setAuth] = useState<AuthState>($auth.get());
  // --------- SINCRONIZAR CON LA TIENDA GLOBAL ----------
  useEffect(() => {
    // Nos suscribimos a los cambios en la tienda global.
    // Si `logoutUser` se llama desde `SesionButton`, este `AuthProvider` se enterará
    // y actualizará su propio estado para que los componentes hijos (como FormularioMirabus) reaccionen.
    const unsubscribe = $auth.subscribe((newState) => {
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
      return null;
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
  return context!;
};
