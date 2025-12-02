import React from "react";

export default function DashboardView() {
  return (
    <>
      <div className="space-y-8">
        {/* --- Cabecera de Bienvenida --- */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido al Panel de administracion
          </h1>
          <p className="text-gray-600 mt-1">
            Porfavor maneje con cuidado las caracteristicas y funciones del panel
          </p>
        </div>
      </div>
    </>
  );
}
