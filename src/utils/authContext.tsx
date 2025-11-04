import React, { createContext, useContext, useState, useEffect } from "react";

const API_URL = import.meta.env.PUBLIC_API_URL;

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
  secureFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider principal

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  // --------- LOGIN ----------
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include", // 🔒 incluye cookies
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Credenciales inválidas");

    // El backend ya setea cookies, solo recuperamos datos del usuario
    const data = await res.json();
    setAuth({ isAuthenticated: true, user: data.user, loading: false });
  };

  // --------- LOGOUT ----------
  const logout = async () => {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    setAuth({ isAuthenticated: false, user: null, loading: false });
  };

  // --------- SECURE FETCH ----------
  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
    });

    if (res.status === 401) {
      // Intentar refrescar sesión
      const refreshed = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (refreshed.ok) {
        // Nuevo access token emitido en cookie → reintenta
        return fetch(url, { ...options, credentials: "include" });
      } else {
        // Refresh falló → cerrar sesión
        setAuth({ isAuthenticated: false, user: null, loading: false });
        throw new Error("Sesión expirada. Inicia sesión nuevamente.");
      }
    }

    return res;
  };

  // --------- CHECK SESSION ----------
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/check`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setAuth({ isAuthenticated: true, user: data.user, loading: false });
        } else {
          setAuth({ isAuthenticated: false, user: null, loading: false });
        }
      } catch {
        setAuth({ isAuthenticated: false, user: null, loading: false });
      }
    };
    checkSession();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, secureFetch }}>
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
