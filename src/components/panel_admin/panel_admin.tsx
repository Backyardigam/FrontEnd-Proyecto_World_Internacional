import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $auth } from "../../utils/authStore";
import { logoutUser } from "../../utils/authActions";
import { apiGet } from "../../utils/apiClient";
import '../../styles/global.css';
import { Usuario , Dashboard } from "../iconos/Usuario";
import { Boleto } from "../iconos/Boleto"

import DashboardView from './views/DashboardView';
import BoletosView from './views/BoletosView';
import GestionPaginaView from './views/GestionPaginaView';
import UsuariosView from './views/UsuariosView';
import AuditoriaView  from './views/AuditoriaView';

// Tipo para controlar la vista activa en el panel
type AdminView = 'dashboard' | 'boletos' | 'gestion' | 'usuarios' | 'auditoria';

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
  const [activeView, setActiveView] = useState<AdminView>('dashboard');

  // useEffect(() => {
  //   const verifyAccess = async () => {
  //     try {
  //       await apiGet("/auth/check-admin", { cache: 'no-store', redirectPath: '/core-tacana-wits-7b345' });
  //     } catch (error) {
  //       console.log("xdd")
        // window.location.href = "/core-tacana-wits-7b345"; //por si el server falla
  //     }
  //   }
  //   verifyAccess();
  // }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/core-tacana-wits-7b345";
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon:<Dashboard/>},
    { id: 'boletos', label: 'Boletos', icon: <Boleto />},
    { id: 'gestion', label: 'Gestión de Página', icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" },
    { id: 'usuarios', label: 'Usuarios', icon: <Usuario/> },
    { id: 'auditoria', label: 'Auditoría', icon: "M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="h-16 flex items-center justify-center text-2xl font-bold border-b border-gray-700">
          Admin Panel
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={() => setActiveView(item.id as AdminView)}
              className={`flex items-center px-4 py-2.5 rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              {typeof item.icon === 'string' ? (
                <Icon path={item.icon} />
              ) : (
                <span className="w-6 h-6">{item.icon}</span>
              )}
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-700 capitalize">{activeView}</h1>
          <div className="text-right">
            <p className="font-semibold text-gray-800">{user?.name || "Administrador"}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">

          {/* Renderizado condicional de la vista activa */}
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'boletos' && <BoletosView />}
          {activeView === 'gestion' && <GestionPaginaView />}
          {activeView === 'usuarios' && <UsuariosView />}
          {activeView === 'auditoria' && <AuditoriaView />}
          
        </main>
      </div>
    </div>
  );
}
