import React, { useState, useEffect } from 'react';
import VehicleDesigner from './VehicleDesigner';
import type { IVehicleCreatePayload, IVehicleDetail, ISeatDistributionItem } from '../admin_utils/mirabusAdmin';
// import { apiGet, apiPost, apiPut, ApiError } from '../../../utils/apiClient';
import { ApiError } from '../../../utils/apiClient';

// --- ¡CAMBIO CLAVE! ---
// Importamos nuestras funciones mock en lugar de las reales.
import { mockGetVehicleById, mockCreateVehicle, mockUpdateVehicle } from '../view_components/apiMock';
const apiGet = mockGetVehicleById;
const apiPost = mockCreateVehicle;
const apiPut = mockUpdateVehicle;

interface VehicleFormProps {
  vehicleId: number | null; // null para crear, ID para editar
  onClose: () => void;
  onSave: () => void;
}

export default function VehicleForm({ vehicleId, onClose, onSave }: VehicleFormProps) {
  const [name, setName] = useState('');
  const [isDefaultGhost, setIsDefaultGhost] = useState(false);
  const [distribution, setDistribution] = useState<ISeatDistributionItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = vehicleId !== null;

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      // Asumimos que esta ruta existe para obtener los detalles de un vehículo
      apiGet(vehicleId)
        .then(data => {
          setName(data.name);
          setIsDefaultGhost(data.isDefaultGhost || false);
          setDistribution(data.seatDistribution);
        })
        .catch(err => setError("No se pudieron cargar los datos del vehículo."))
        .finally(() => setLoading(false));
    }
  }, [vehicleId, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name) {
      setError("El nombre de la plantilla es obligatorio.");
      return;
    }
    if (distribution.length === 0) {
      setError("La plantilla debe tener al menos un asiento.");
      return;
    }

    setLoading(true);

    const payload: IVehicleCreatePayload = {
      name,
      seatCount: distribution.length,
      seatDistribution: distribution,
      isDefaultGhost,
    };

    try {
      if (isEditMode) {
        // Asumimos que la ruta PUT existe
        await apiPut(vehicleId, payload);
      } else {
        // Asumimos que la ruta POST existe
        await apiPost(payload);
      }
      onSave(); // Notifica al padre para que refresque la lista
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al guardar la plantilla.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return <p>Cargando datos de la plantilla...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        {isEditMode ? `Editando Plantilla: ${name}` : 'Crear Nueva Plantilla de Vehículo'}
      </h3>

      {error && <div className="p-3 text-red-700 bg-red-100 rounded-lg">{error}</div>}

      <div className="p-6 border border-gray-200 rounded-lg space-y-6">
        <div>
          <label htmlFor="vehicleName" className="block text-sm font-medium text-gray-700">Nombre de la Plantilla</label>
          <input
            type="text"
            id="vehicleName"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Bus Panorámico 45 Asientos"
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isDefaultGhost"
            checked={isDefaultGhost}
            onChange={e => setIsDefaultGhost(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="isDefaultGhost" className="ml-2 block text-sm text-gray-900">
            Marcar como plantilla "Fantasma" por defecto
          </label>
        </div>
      </div>

      <div className="p-6 border border-gray-200 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Diseñador de Asientos</h4>
        <VehicleDesigner
          initialDistribution={distribution}
          onDistributionChange={setDistribution}
        />
      </div>

      <div className="border-t pt-6 flex justify-between items-center">
        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
          &larr; Volver a la lista
        </button>
        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar Plantilla'}
        </button>
      </div>
    </form>
  );
}