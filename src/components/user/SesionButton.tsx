import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { $auth } from "../../utils/authStore";
import { logoutUser } from "../../utils/authActions";

export default function SesionButton() {
    const authState = useStore($auth);
    const [isClient, setIsClient] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await logoutUser();
        window.location.href = '/';
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || authState.loading) {
        return <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>;
    }

    if (authState.isAuthenticated && authState.user) {
        switch (authState.user.role) {
            case 'user':
                return (
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 hover:border-naranja-f focus:outline-none focus:ring-2 focus:ring-naranja-c focus:ring-opacity-50 transition">
                            {authState.user.avatar ? (
                                <img src={authState.user.avatar} alt={`Avatar de ${authState.user.name}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-naranja-c text-white flex items-center justify-center text-lg font-bold">
                                    {(authState.user.name || authState.user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </button>
    
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                    <p className="font-semibold">{authState.user.name || 'Usuario'}</p>
                                    <p className="text-xs text-gray-500 truncate">{authState.user.email}</p>
                                </div>
                                <a href="/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    Mi Perfil
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
            
            case 'guest':
                return <a href="/login" className="px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">Registrarse</a>;
            
            default:
                break;
        }
    }

    return (
        <a href="/login" className="px-4 py-2 text-sm font-semibold bg-naranja-c text-white rounded-md hover:bg-naranja-f transition-colors">
            Iniciar Sesión
        </a>
    );
}