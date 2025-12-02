import React from "react";
import { useAuth } from "../../../utils/authContext";

// --- Componentes Internos para un Dashboard más limpio ---

const StatCard = ({ title, value, icon, colorClass }: { title: string, value: string, icon: React.ReactNode, colorClass: string }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${colorClass}`}>
    <div className="flex items-center">
      <div className="mr-4 text-gray-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  </div>
);

const ActionButton = ({ title, description, icon, onClick }: { title: string, description: string, icon: React.ReactNode, onClick: () => void }) => (
  <button onClick={onClick} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all flex items-center">
    <div className="mr-4 text-blue-600">
      {icon}
    </div>
    <div>
      <p className="font-semibold text-gray-800">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </button>
);

// --- Iconos SVG para no instalar más dependencias ---

const TicketIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 00-2-2H5z" /></svg>;
const MoneyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

export default function DashboardView() {
  const { auth, renderWhenReady } = useAuth();

  return (
    <>
      {renderWhenReady(
        <div className="space-y-8">
          {/* --- Cabecera de Bienvenida --- */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800">
              ¡Bienvenido de vuelta, {auth.user?.name || 'Empleado'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Aquí tienes un resumen de la actividad de hoy.
            </p>
          </div>

          {/* --- Tarjetas de Estadísticas --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Boletos Vendidos Hoy" 
              value="124" 
              icon={<TicketIcon />}
              colorClass="border-blue-500"
            />
            <StatCard 
              title="Ingresos del Día" 
              value="S/ 8,750.00" 
              icon={<MoneyIcon />}
              colorClass="border-green-500"
            />
            <StatCard 
              title="Próximos Viajes" 
              value="5" 
              icon={<CalendarIcon />}
              colorClass="border-yellow-500"
            />
            <StatCard 
              title="Usuarios Activos" 
              value="8" 
              icon={<UsersIcon />}
              colorClass="border-purple-500"
            />
          </div>

          {/* --- Acciones Rápidas --- */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionButton 
                title="Gestionar Boletos"
                description="Busca, visualiza y agrupa boletos de clientes."
                icon={<ArrowRightIcon />}
                onClick={() => { /* Lógica para navegar a la vista de boletos */ }}
              />
              <ActionButton 
                title="Supervisar Viajes Mirabus"
                description="Monitorea en tiempo real la selección de asientos."
                icon={<ArrowRightIcon />}
                onClick={() => { /* Lógica para navegar a la vista de supervisión */ }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
