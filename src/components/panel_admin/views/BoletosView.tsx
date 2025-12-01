import React, { useState } from "react";
import VistaBoletos from "../view_components/VistaBoletos";
import AgrupacionBoletos from "../view_components/AgrupacionBoletos";

type BoletosAdminView = 'vista' | 'agrupacion';

export default function BoletosView() {
  const [activeView, setActiveView] = useState<BoletosAdminView>('vista');

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveView('vista')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeView === 'vista'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Vista de Boletos
        </button>
        <button
          onClick={() => setActiveView('agrupacion')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeView === 'agrupacion'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Agrupación
        </button>
      </div>

      {activeView === 'vista' && <VistaBoletos />}
      {activeView === 'agrupacion' && <AgrupacionBoletos />}
    </div>
  );
}
