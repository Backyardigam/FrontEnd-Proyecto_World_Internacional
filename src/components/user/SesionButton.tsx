import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { $auth } from "../../utils/authStore";
import { logoutUser } from "../../utils/authActions";

export default function SesionButton() {
    // 1. Nos suscribimos a la tienda global de Nanostores.
    const authState = useStore($auth);
    // Estado para controlar la visibilidad del menú desplegable
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Ref para el contenedor del menú para detectar clics fuera de él
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 2. Manejador para el logout que llama a nuestra nueva acción global.
    const handleLogout = async () => {
        await logoutUser();
        // Opcional: redirigir a la página de inicio después del logout.
        window.location.href = '/';
    };

    // Efecto para cerrar el menú si se hace clic fuera de él
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        // Añadir el listener cuando el menú está abierto
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        // Limpiar el listener
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);


    // 3. Renderizamos un placeholder mientras se verifica la sesión inicial.
    if (authState.loading) {
        // Placeholder para el avatar circular
        return <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>;
    }

    // 4. Si el usuario está autenticado (sea 'user' o 'guest').
    if (authState.isAuthenticated && authState.user) {
        // Caso: Usuario registrado
        if (authState.user.rol === 'user' && authState.user.name) {
            return (
                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                        {authState.user.avatarURL ? (
                            <img src={authState.user.avatarURL} alt={`Avatar de ${authState.user.name}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold">
                                {authState.user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                            <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                <p className="font-semibold">{authState.user.name}</p>
                                <p className="text-xs text-gray-500 truncate">{authState.user.email}</p>
                            </div>
                            <a href="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                Datos
                            </a>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        // Caso: Usuario invitado. Podríamos mostrar algo o nada.
        // Por ahora, mostramos un botón para que pueda registrarse o iniciar sesión.
        if (authState.user.rol === 'guest') {
            return <a href="/login" className="px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">Registrarse</a>;
        }
    }

    // 5. Caso por defecto: No hay sesión.
    return (
        <a href="/login" className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
            Iniciar Sesión
        </a>
    );
}