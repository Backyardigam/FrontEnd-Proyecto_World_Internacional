import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { $auth } from "../../utils/authStore";
import { logoutUser, checkAdminSession } from "../../utils/authActions";
import { apiGet } from "../../utils/apiClient";
import '../../styles/global.css';
import { Usuario , Dashboard , MirabusIcon} from "../iconos/Usuario";
import { Boleto } from "../iconos/Boleto"

import DashboardView from './views/DashboardView';
import BoletosView from './views/BoletosView';
import GestionPaginaView from './views/GestionPaginaView';
import UsuariosView from './views/UsuariosView';
import AuditoriaView  from './views/AuditoriaView';
import PromocionesView from './views/PromocionesView';
import Mirabus  from './views/Mirabus';

// Tipo para controlar la vista activa en el panel
type AdminView = 'dashboard' | 'boletos' | 'gestion' | 'promociones' | 'usuarios' | 'auditoria' | 'mirabus';

const Icon = ({ path, className = "w-6 h-6" }: { path: string; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

type MenuItem = {
  id: AdminView;
  label: string;
  icon: string | React.ReactNode; // Puede ser un 'path' de SVG o un componente de React
};

export default function PanelAdmin() {
  const { user } = useStore($auth);
  const [activeView, setActiveView] = useState<AdminView>('gestion');
  const sidebarRef = useRef<HTMLElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/core-tacana-wits-7b345";
  };

  // Al cargar el panel, verificamos si la sesión es de un administrador.
  useEffect(() => {
    checkAdminSession();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Si el sidebar está abierto, el ref existe y el clic fue fuera del sidebar...
      if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    // Añadir el listener solo cuando el sidebar está abierto
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Limpiar el listener cuando el componente se desmonte o el sidebar se cierre
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]); // El efecto se re-ejecuta cada vez que 'isSidebarOpen' cambia

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon:<Dashboard/>},
    { id: 'mirabus', label: 'Mirabus', icon:<MirabusIcon />},
    { id: 'boletos', label: 'Boletos', icon: <Boleto />},
    { id: 'gestion', label: 'Gestión de Página', icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
    { id: 'promociones', label: 'Promociones', icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" },
    { id: 'usuarios', label: 'Usuarios', icon: <Usuario/> },
    { id: 'auditoria', label: 'Auditoría', icon: "M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside ref={sidebarRef} className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white flex flex-col transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-30`}>
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveView(item.id as AdminView);
                if (window.innerWidth < 768) { // Cierra el sidebar en móvil al seleccionar una opción
                  setIsSidebarOpen(false);
                }
              }}
              className={`flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              {typeof item.icon === 'string' ? (
                <Icon path={item.icon} />
              ) : ( item.icon )}
              <span className="ml-4">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2.5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors duration-200"
          >
            <Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            <span className="ml-4">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido de la seccion */}

      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Btn para celulares */}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          {/* Perfil */}
          <h1 className="text-xl font-semibold text-gray-700 capitalize">{activeView}</h1>
          <div className="text-right">
            <p className="font-semibold text-gray-800">{user?.name || "Administrador"}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {/* Renderizado condicional de la vista activa */}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'mirabus' && <Mirabus />}
          {activeView === 'boletos' && <BoletosView />}
          {activeView === 'gestion' && <GestionPaginaView />}
          {activeView === 'promociones' && <PromocionesView />}
          {activeView === 'usuarios' && <UsuariosView />}
          {activeView === 'auditoria' && <AuditoriaView />}
        </main>
      </div>
    </div>
  );
}
