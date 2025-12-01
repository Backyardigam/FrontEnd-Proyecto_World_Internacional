import React, { useState, useEffect } from "react";
import SupervisarViajesView from "../view_components/SupervisarViajesView";
import VehicleForm from "../view_components/VehicleForm";
import type { IVehicleListItem } from "../admin_utils/mirabusAdmin";
// import { apiGet, apiDelete } from "../../../utils/apiClient";

// --- ¡CAMBIO CLAVE! ---
// Importamos nuestras funciones mock en lugar de las reales.
// Cuando el backend esté listo, solo tendremos que cambiar estas importaciones.
import { mockGetVehicles, mockDeleteVehicle } from "../view_components/apiMock";
const apiGet = mockGetVehicles; // Renombramos para mínima refactorización
const apiDelete = mockDeleteVehicle; // Renombramos para mínima refactorización

type MirabusView = 'supervisar' | 'gestionar';
type GestionarSubView = 'list' | 'form';

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

      {activeView === 'gestionar' && <GestionarBusesView />}
    </div>
  );
}

// --- Componente para la vista "Gestionar Buses" ---

function GestionarBusesView() {
  const [subView, setSubView] = useState<GestionarSubView>('list');
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<IVehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      // Asumimos que esta ruta existe para obtener la lista de vehículos
      const data = await apiGet(); // Ya no necesita la ruta
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError("No se pudieron cargar las plantillas de vehículos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subView === 'list') {
      fetchVehicles();
    }
  }, [subView]);

  const handleEdit = (id: number) => {
    setEditingVehicleId(id);
    setSubView('form');
  };

  const handleCreate = () => {
    setEditingVehicleId(null);
    setSubView('form');
  };

  const handleCloseForm = () => {
    setEditingVehicleId(null);
    setSubView('list');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.")) return;

    try {
      // Asumimos que la ruta DELETE existe
      await apiDelete(id); // La función mock solo necesita el ID
      fetchVehicles(); // Refrescar la lista
    } catch (err) {
      alert("Error al eliminar la plantilla.");
    }
  };

  if (subView === 'form') {
    return <VehicleForm vehicleId={editingVehicleId} onClose={handleCloseForm} onSave={handleCloseForm} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Plantillas de Vehículos</h3>
        <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
          Crear Nueva Plantilla
        </button>
      </div>

      {loading && <p>Cargando plantillas...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
              <div>
                <p className="font-semibold">{vehicle.name} {vehicle.isDefaultGhost && <span className="ml-2 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">FANTASMA</span>}</p>
                <p className="text-sm text-gray-600">{vehicle.seatCount} asientos</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleEdit(vehicle.id)} className="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600">Editar</button>
                <button onClick={() => handleDelete(vehicle.id)} className="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}