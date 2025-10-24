import React from "react";
import { useUser } from "../hooks/useUser"; // Asegúrate de que la ruta sea correcta

export default function ButtonUser(){
    const { user, loading, handleLogout, handleLogin } = useUser();

    if (loading) {
        return <div>Cargando usuario...</div>; //Manjear el estado cargando
    }

    //IMPORTANTE MANEJAR LA LOGICA PARA LOS 3 TIPOS DE CASOS REGISTRADO/INVITADO/SIN SESION
    if (user) {
        
        return (
            <div>
                <span>Hola, {user.name || user.email || "Usuario"}</span> {/* Asume que el usuario tiene una propiedad 'name' o 'email' */}
                <button onClick={handleLogout}>Cerrar Sesión</button>
            </div>
        );
    } else {
        
        return (
            <button onClick={() => console.log("Redirigir a login o abrir modal")}>
                Iniciar Sesión
            </button>
        );
    }
}