import React, { useState, useEffect } from "react";
import SupervisarViajesView from "../view_components/SupervisarViajesView";
import VehicleForm from "../view_components/VehicleForm";
import type { IVehicleListItem } from "../admin_utils/mirabusAdmin";
import { apiGet, apiDelete } from "../../../utils/apiClient";

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
      // Ruta para obtener la lista de vehículos (plantillas)
      const data = await apiGet<IVehicleListItem[]>('/manage/mirabus');
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
      // Ruta DELETE para eliminar una plantilla de vehículo
      await apiDelete(`/manage/mirabus/vehicle/${id}`);
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

      <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong className="font-medium text-yellow-800">Advertencia de Edición:</strong> Antes de cambiar la distribución de asientos, asegúrese de que esta plantilla no esté asignada a viajes futuros (aparte del bus por defecto). Si reduce la capacidad (ej. de 28 a 20 asientos) en un bus con reservas activas, se perderán los datos de los asientos eliminados.
            </p>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong className="font-medium text-yellow-800">Advertencia de Eliminación:</strong> Antes de eliminar algun bus, asegúrese de que esta plantilla no esté asignada a viajes futuros (aparte del bus por defecto). Si se elimina un bus cuando este esta asignado a un viaje es probable que se pierdan los datos de los asientos reservados.
            </p>
          </div>
        </div>
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