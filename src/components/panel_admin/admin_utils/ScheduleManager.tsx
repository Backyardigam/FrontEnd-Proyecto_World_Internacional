import React from 'react';
import type { IScheduleInput } from './servicioAdmin';
import Boton from './Boton';

interface ScheduleManagerProps {
  schedules: IScheduleInput[];
  onChange: (newSchedules: IScheduleInput[]) => void;
  error: string | null;
}

export default function ScheduleManager({ schedules, onChange, error }: ScheduleManagerProps) {

  /**
   * Maneja el cambio en los inputs de un horario específico.
   */
  const handleScheduleChange = (index: number, field: keyof IScheduleInput, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index] = { ...newSchedules[index], [field]: value };
    onChange(newSchedules);
  };

  /**
   * Añade un nuevo horario vacío a la lista.
   */
  const handleAddSchedule = () => {
    onChange([...schedules, { startTrip: '', endTrip: '' }]);
  };

  /**
   * Elimina un horario de la lista por su índice.
   */
  const handleRemoveSchedule = (index: number) => {
    const newSchedules = schedules.filter((_, i) => i !== index);
    onChange(newSchedules);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Horarios (uno o más)
        </label>
        <Boton
          text="Añadir Horario"
          style="bg-blue-500 text-sm"
          onPress={handleAddSchedule}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <div className="space-y-3 mt-2">
        {schedules.map((schedule, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded-md border-gray-300 bg-gray-50">
            <div className="flex-1">
              <label htmlFor={`startTrip-${index}`} className="text-xs text-gray-500">Hora de Inicio</label>
              <input
                id={`startTrip-${index}`}
                type="time"
                value={schedule.startTrip}
                onChange={(e) => handleScheduleChange(index, 'startTrip', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor={`endTrip-${index}`} className="text-xs text-gray-500">Hora de Fin</label>
              <input
                id={`endTrip-${index}`}
                type="time"
                value={schedule.endTrip || ''}
                onChange={(e) => handleScheduleChange(index, 'endTrip', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded-md"
              />
            </div>
            <div className="self-end">
              <Boton
                text="Eliminar"
                style="bg-red-500"
                onPress={() => handleRemoveSchedule(index)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}