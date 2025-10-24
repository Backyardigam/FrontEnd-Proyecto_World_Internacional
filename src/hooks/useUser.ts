import { useState, useEffect, useCallback } from "react";

// Define una interfaz para tu objeto de usuario.
// Ajusta esto según la estructura real de tu objeto de usuario en localStorage.
interface User {
  id: string;
  name: string;
  email: string;
  // Agrega aquí cualquier otra propiedad que tenga tu objeto de usuario
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Opcional: para indicar si la carga inicial ha terminado

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsedUser: User = JSON.parse(stored);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error al parsear los datos de usuario de localStorage:", error);
        setUser(null);
      }
    }
    setLoading(false); // La carga inicial ha terminado
  }, []);

  // Handler para cerrar sesión
  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // Handler para iniciar sesión (ejemplo, podrías pasarlo desde un componente)
  const handleLogin = useCallback((userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Puedes agregar más handlers aquí, por ejemplo, para actualizar el perfil del usuario
  // const updateProfile = useCallback((newProfileData: Partial<User>) => {
  //   if (user) {
  //     const updatedUser = { ...user, ...newProfileData };
  //     localStorage.setItem("user", JSON.stringify(updatedUser));
  //     setUser(updatedUser);
  //   }
  // }, [user]);

  return { user, loading, handleLogout, handleLogin /*, updateProfile */ };
}
