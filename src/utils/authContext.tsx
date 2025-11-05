import React, { createContext, useContext, useState, useEffect } from "react";
import { apiGet, apiPost } from "./apiClient";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  renderWhenReady: (children: React.ReactNode) => React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider principal

const USER_STORAGE_KEY = 'app_user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  // --------- LOGIN ----------
  const login = async (email: string, password: string) => {
    // Usamos apiPost. Le pasamos el objeto directamente y le decimos que esperamos un objeto con una propiedad 'user'.
    const { user } = await apiPost<{ user: User }>("/auth/login", { email, password });
    // Guardamos los datos del usuario en localStorage
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    // Actualizamos el estado
    setAuth({ isAuthenticated: true, user, loading: false });
  };

  // --------- LOGOUT ----------
  const logout = async () => {
    // apiPost también funciona para peticiones sin cuerpo y donde no nos importa la respuesta.
    // El try/catch es por si el servidor falla, aunque para un logout podríamos ignorarlo.
    try {
      await apiPost("/auth/logout", {});
    } catch (error) {
      console.error("Error durante el logout:", error);
    }
    // Limpiamos localStorage y el estado
    localStorage.removeItem(USER_STORAGE_KEY);
    setAuth({ isAuthenticated: false, user: null, loading: false });
  };

  // --------- CHECK SESSION ----------
  useEffect(() => {
    const checkSession = async () => {
      // 1. Intentar leer los datos del usuario desde localStorage
      const storedUserJSON = localStorage.getItem(USER_STORAGE_KEY);
      if (!storedUserJSON) {
        // Si no hay datos, no hay sesión.
        setAuth({ isAuthenticated: false, user: null, loading: false });
        return;
      }

      try {
        // 2. Hay datos, ahora validamos la sesión con el backend.
        // Este endpoint ya no devuelve datos, solo un 200 OK si la cookie es válida.
        await apiGet("/auth/check");

        // 3. Si la llamada es exitosa, la sesión es válida. Usamos los datos de localStorage.
        const user = JSON.parse(storedUserJSON) as User;
        setAuth({ isAuthenticated: true, user, loading: false });
      } catch (error) {
        // 4. Si la llamada falla (401), la sesión es inválida. Limpiamos todo.
        localStorage.removeItem(USER_STORAGE_KEY);
        setAuth({ isAuthenticated: false, user: null, loading: false });
      }
    };
    checkSession();
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
    <AuthContext.Provider value={{ auth, login, logout, renderWhenReady }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook de acceso global

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
