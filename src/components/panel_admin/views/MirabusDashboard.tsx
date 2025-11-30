import React, { useState } from "react";
import SupervisarViajesView from "../view_components/SupervisarViajesView";

type MirabusView = 'supervisar' | 'gestionar';

export default function MirabusDashboard() {
  const [activeView, setActiveView] = useState<MirabusView>('supervisar');

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveView('supervisar')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeView === 'supervisar'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Supervisar Viajes
        </button>
        <button
          onClick={() => setActiveView('gestionar')}
          className={`px-4 py-2 text-lg font-medium transition-colors ${
            activeView === 'gestionar'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Gestionar Buses
        </button>
      </div>

      {activeView === 'supervisar' && (
        <SupervisarViajesView />
      )}

      {activeView === 'gestionar' && (
        <div className="text-center text-gray-500 p-10">Sección para crear y configurar buses (en desarrollo).</div>
      )}
    </div>
  );
}