import React, { useEffect, useState } from 'react';
import { apiGet, apiPut } from "../../../utils/apiClient";
import type { IResponseVehiclesList, IVehicleListItem, IBusAssignment } from './SupervisarViajes.utils';

interface Props {
  mirabusId: string;
  onBack: () => void;
  onSaveSuccess?: () => void; // Opcional: callback para refrescar la tabla principal
}

// Estado local extendido para manejar la UI
interface LocalAssignmentState {
  busOrder: string;
  vehicleId: number | ''; // '' para cuando recién se agrega y no se ha seleccionado nada
  isOriginal: boolean;    // Para saber si podemos borrarlo
  originalSeatCount?: number; // Para la regla de validación de asientos
}

export default function VehicleAssignmentView({ mirabusId, onBack, onSaveSuccess }: Props) {
  // --- Estados ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos maestros
  const [availableVehicles, setAvailableVehicles] = useState<IVehicleListItem[]>([]);
  // Lista de asignaciones (la que renderiza las tarjetas)
  const [assignments, setAssignments] = useState<LocalAssignmentState[]>([]);

  // --- Carga de Datos ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Usamos el mirabusId en la ruta como indicaste
        const data = await apiGet<IResponseVehiclesList>(`/manage/mirabus/assign-trip/${mirabusId}`);

        setAvailableVehicles(data.vehicles);

        // Transformamos los datos recibidos al estado local
        const initialAssignments: LocalAssignmentState[] = data.assigned.map(item => ({
          busOrder: item.busOrder,
          vehicleId: item.vehicleId,
          isOriginal: true, // Estos no se pueden borrar
          originalSeatCount: item.seatCount // Guardamos la capacidad original para validar
        }));

        setAssignments(initialAssignments);
      } catch (err: any) {
        setError(err.message || "Error al cargar la asignación de vehículos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mirabusId]);

  // --- Lógica de Negocio ---

  // Generar el siguiente código (ej: B-01 -> B-02)
  const getNextBusOrder = (baseAssignments: LocalAssignmentState[]): string => {
    // Encontramos el número más alto, incluyendo solo las asignaciones originales
    const originalCount = baseAssignments.filter(a => a.isOriginal).length;

    // Si hay tarjetas agregadas, tomamos el último número de la lista (originales + agregadas)
    // para encontrar el siguiente índice.
    const nextNum = baseAssignments.length + 1;

    // Si solo hay originales, empezamos a partir de ese número + 1
    // Si tenemos B-01, B-02 (originales), el siguiente es B-03
    if (baseAssignments.length === 0) return "B-01";

    const lastOrder = baseAssignments[baseAssignments.length - 1].busOrder;

    // Calculamos el índice base para el nuevo elemento
    const baseIndex = baseAssignments.length + 1;

    return `B-${baseIndex.toString().padStart(2, '0')}`;
  };

  // Implementación simplificada de la renumeración
  const renumberAssignments = (assignmentsList: LocalAssignmentState[]) => {
    let currentNumber = 1;
    return assignmentsList.map(item => {
      if (item.isOriginal) {
        // Mantenemos el orden de bus original
        return item;
      } else {
        // Renombramos los agregados para mantener la secuencia
        const newOrder = `B-${currentNumber.toString().padStart(2, '0')}`;
        currentNumber++; // Incrementamos para el siguiente agregado
        // Nota: Esto funciona mejor si la lista de agregados va al final.
        // Si no, necesitamos un conteo más sofisticado.
        // Por el formato B-01, B-02, asumiremos que los agregados se añaden al final.
        return {
          ...item,
          busOrder: newOrder
        };
      }
    });
  };

  const handleAddBus = () => {
    // Usamos el número total de ítems + 1 para calcular el nuevo B-XX
    const nextNum = assignments.length + 1;
    const newOrder = `B-${nextNum.toString().padStart(2, '0')}`;

    setAssignments([
      ...assignments,
      {
        busOrder: newOrder,
        vehicleId: '', // Inicia vacío
        isOriginal: false, // Es nuevo, se puede borrar
      }
    ]);
  };

  const handleRemoveBus = (indexToRemove: number) => {
    const itemToRemove = assignments[indexToRemove];

    // Solo permitir borrar si NO es original
    if (!itemToRemove.isOriginal) {

      // 1. Eliminamos el ítem de la lista temporalmente
      const filteredAssignments = assignments.filter((_, idx) => idx !== indexToRemove);

      // 2. Renumeramos solo los elementos *no originales* restantes para mantener la secuencia
      let nextRenumberIndex = 1;
      const renumberedAssignments = filteredAssignments.map(item => {
        if (item.isOriginal) {
          return item; // Los originales NO cambian
        } else {
          // Renombramos los que NO son originales
          const newOrder = `B-${nextRenumberIndex.toString().padStart(2, '0')}`;
          nextRenumberIndex++;
          return {
            ...item,
            busOrder: newOrder
          };
        }
      });

      setAssignments(renumberedAssignments);
    }
  };

  const handleChangeVehicle = (index: number, newVehicleId: string) => {
    const updated = [...assignments];
    updated[index].vehicleId = Number(newVehicleId);
    setAssignments(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validación simple: todos deben tener vehículo seleccionado
      const incomplete = assignments.find(a => a.vehicleId === '');
      if (incomplete) {
        alert(`Por favor selecciona un vehículo para el orden ${incomplete.busOrder}`);
        setSaving(false);
        return;
      }

      // Preparamos el payload
      const payload: IBusAssignment[] = assignments.map(a => ({
        busOrder: a.busOrder,
        vehicleId: a.vehicleId as number
      }));

      await apiPut(`/manage/mirabus/assign-trip/${mirabusId}`, payload);

      if (onSaveSuccess) onSaveSuccess();
      onBack(); // Volver al inicio

    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Cargando asignaciones...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error} <br /><button onClick={onBack} className="underline mt-2">Volver</button></div>;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">

      {/* --- HEADER --- */}
      <div className="flex items-center gap-4 border-b pb-2">
        <button
          onClick={onBack}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
          title="Volver"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
          Asignación de Vehículos
        </h2>
      </div>

      {/* --- ADVERTENCIA Y BOTÓN AGREGAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-orange-50 border-l-4 border-orange-400 p-4 rounded shadow-sm">
        <div className="text-sm text-orange-800">
          <p className="font-bold mb-1">Nota Importante:</p>
          <p>
            Al reasignar un vehículo a una orden existente (ej. B-01),
            <strong> no se permite seleccionar vehículos con menor capacidad </strong>
            a la asignada originalmente.
          </p>
        </div>
        <button
          onClick={handleAddBus}
          className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition shadow flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Bus
        </button>
      </div>

      {/* --- LISTADO DE CASILLAS (GRID) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((item, index) => (
          <div
            key={`${item.busOrder}-${index}`}
            className={`relative p-4 rounded-lg border shadow-sm transition-all ${item.isOriginal ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 ring-1 ring-blue-100'
              }`}
          >
            {/* Cabecera de la tarjeta */}
            <div className="flex justify-between items-center mb-3">
              <span className="font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded text-sm">
                {item.busOrder}
              </span>

              {/* Botón Eliminar (Solo para nuevos) */}
              {!item.isOriginal && (
                <button
                  onClick={() => handleRemoveBus(index)}
                  className="text-red-400 hover:text-red-600 transition"
                  title="Eliminar esta casilla"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Selector de Vehículo */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-gray-500 mb-1 uppercase">Vehículo Asignado</label>
              <select
                value={item.vehicleId}
                onChange={(e) => handleChangeVehicle(index, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="" disabled>Seleccionar...</option>
                {availableVehicles.map(v => {
                  // Regla: Si es original, no permitir seatCount < originalSeatCount
                  const isCapacityInvalid = item.isOriginal && item.originalSeatCount && v.seatCount < item.originalSeatCount;

                  return (
                    <option
                      key={v.id}
                      value={v.id}
                      disabled={!!isCapacityInvalid} // Convertir a boolean
                      className={isCapacityInvalid ? "text-gray-300 bg-gray-50" : ""}
                    >
                      {v.name} - {v.seatCount} asientos {isCapacityInvalid ? '(Capacidad insuficiente)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* --- FOOTER / ACCIONES --- */}
      <div className="flex justify-end mt-4 pt-4 border-t">
        <button
          onClick={handleSave}
          disabled={saving || assignments.length === 0}
          className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {saving ? (
            <>Guardando...</>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Confirmar Asignación
            </>
          )}
        </button>
      </div>

    </div>
  );
}