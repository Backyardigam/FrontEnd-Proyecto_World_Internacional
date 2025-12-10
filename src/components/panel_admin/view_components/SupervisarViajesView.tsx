import React, { useState } from 'react';
import { MirabusFilters } from './SuperViajesFiltros';
import { MirabusTable } from './SuperViajesTabla';
import MirabusReservationView from './SuperViajesMirabus'
import VehicleAssignmentView from './VehicleAssignmentView';

// Simulación de los otros componentes que mencionaste
const MockAssign = ({ id, onBack }: any) => (
  <div className="p-4"><h1>Componente Asignar (ID Mirabus: {id})</h1><button onClick={onBack} className="text-blue-500 underline">Volver</button></div>
);

type ViewState = 'LIST' | 'CREATE' | 'RESERVE' | 'ASSIGN';

export default function SupervisarViajesView() {
  const [view, setView] = useState<ViewState>('LIST');
  const [reserveData, setReserveData] = useState<any>(null);
  const [assignId, setAssignId] = useState<string>('');
  const [assignMirabusId, setAssignMirabusId] = useState<string>('');

  // Handlers de navegación
  const goToList = () => {
    setView('LIST');
    setReserveData(null); // Limpiar datos de reserva si existen
    setAssignId(''); // Limpiar datos de asignación si existen
  };

  const handleNewTrip = () => {
    setView('CREATE');
  };

  const handleReserve = (data: { serviceId: string, serviceName: string, date: string, schedule: string }) => {
    setReserveData(data);
    setView('RESERVE');
  };

  const handleAssign = (mirabusId: string) => {
    setAssignMirabusId(mirabusId);
    setView('ASSIGN'); // Asumiendo que 'ASSIGN' es tu string para esta vista
  };

  // Renderizado condicional de vistas
  if (view === 'RESERVE' && reserveData) {
    return (
      <div className="p-4">
        <MirabusReservationView initialData={reserveData} onBack={goToList} />
      </div>
    );
  }

  if (view === 'CREATE') {
    return (
      <div className="p-4">
        <MirabusReservationView onBack={goToList} />
      </div>
    );
  }

  if (view === 'ASSIGN') {
    return (
      <div className="p-4 border border-blue-400 m-4 rounded-lg bg-white">
        <VehicleAssignmentView
          mirabusId={assignMirabusId}
          onBack={goToList}
          onSaveSuccess={() => {
            console.log("Asignación completada");
          }}
        />
      </div>
    );
  }

  // Vista Principal (Lista)
  return (
    <div className="max-w-7xl mx-auto p-4 border border-blue-400 m-4 rounded-lg">
      {/* Borde azul simulando la imagen */}

      <MirabusFilters
        onNewTrip={handleNewTrip}
      />

      <div className="mt-6">
        <MirabusTable
          onReserve={handleReserve}
          onAssign={handleAssign}
        />
      </div>
    </div>
  );
}