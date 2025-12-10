import { useStore } from '@nanostores/react'; // Importante: necesitamos leer el estado actual también
import React, { useEffect, useState } from 'react';
import { apiGet } from "../../../utils/apiClient";
import type { IServicesTypeMirabus } from './SupervisarViajes.utils';
import { updateFilters, filtersAtom } from './SuperViajesStore';

interface Props {
  onNewTrip: () => void;
}

export const MirabusFilters: React.FC<Props> = ({ onNewTrip }) => {
  // Leemos el estado global para saber si hay filtros aplicados actualmente
  const $filters = useStore(filtersAtom);

  const [servicesData, setServicesData] = useState<IServicesTypeMirabus[]>([]);

  // Estados locales del formulario
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    apiGet<IServicesTypeMirabus[]>('/manage/mirabus/filters')
      .then((data) => { if (data) setServicesData(data); })
      .catch((err) => console.error(err));
  }, []);

  const activeService = servicesData.find(s => s.id === selectedServiceId);

  // --- Limpiar Filtros ---
  const handleClearFilters = () => {
    // 1. Limpiar los estados visuales (inputs)
    setSelectedServiceId('');
    setSelectedSchedule('');
    setSelectedDate('');

    // 2. Actualizar el store global con vacíos.
    // Al recibir vacíos, la Tabla hará el fetch de: manage/mirabus/list?page=1&limit=20
    updateFilters({
      serviceId: '',
      schedule: '',
      date: ''
    });
  };

  const handleApplyFilter = () => {
    updateFilters({
      serviceId: selectedServiceId,
      schedule: selectedSchedule,
      date: selectedDate
    });
  };

  // Lógica de botones
  const hasLocalChanges = selectedServiceId !== '' || selectedDate !== '';
  // ¿Hay filtros aplicados realmente en la tabla?
  const hasActiveFilters = $filters.serviceId !== '' || $filters.date !== '';

  return (
    <div className="bg-gray-200 p-4 rounded-md mb-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-3 text-gray-700">Filtros</h2>

      <div className="flex flex-wrap items-end gap-4">

        {/* Dropdown Servicio */}
        <div className="flex flex-col w-64">
          <label className="mb-1 text-sm font-medium text-gray-600">Servicio</label>
          <select
            className="p-2 rounded border border-gray-300 bg-white"
            value={selectedServiceId}
            onChange={(e) => {
              setSelectedServiceId(e.target.value);
              setSelectedSchedule('');
            }}
          >
            <option value="">Seleccionar Servicio</option>
            {servicesData.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Datepicker */}
        <div className="flex flex-col w-64">
          <label className="mb-1 text-sm font-medium text-gray-600">Fecha</label>
          <div className="flex gap-1">
            <input
              type="date"
              className="p-2 rounded border border-gray-300 bg-white flex-grow"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="bg-white px-2 rounded border text-xs hover:bg-gray-100"
              title="Hoy"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Dropdown Horario */}
        <div className="flex flex-col w-64">
          <label className="mb-1 text-sm font-medium text-gray-600">Horario</label>
          <select
            className="p-2 rounded border border-gray-300 bg-white disabled:bg-gray-100 disabled:text-gray-400"
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            disabled={!selectedServiceId}
          >
            <option value="">{selectedServiceId ? 'Seleccionar Horario' : '-'}</option>
            {activeService?.schedule.map((time, idx) => (
              <option key={idx} value={time}>{time}</option>
            ))}
          </select>
        </div>

        {/* --- SECCIÓN DE BOTONES --- */}
        <div className="flex gap-2 ml-auto items-center">

          {/* Botón Limpiar: Solo se muestra si hay algo seleccionado localmente O aplicado en el store */}
          {(hasLocalChanges || hasActiveFilters) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-red-600 font-medium hover:text-red-800 hover:bg-red-50 rounded transition-colors text-sm border border-transparent hover:border-red-200"
              title="Quitar todos los filtros"
            >
              Limpiar filtros
            </button>
          )}

          <button
            onClick={handleApplyFilter}
            disabled={!hasLocalChanges} // Solo habilitar si hay algo seleccionado en los inputs
            className={`px-4 py-2 rounded font-medium transition-colors ${hasLocalChanges
              ? 'bg-gray-500 text-white hover:bg-gray-600 shadow-sm'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
          >
            Aplicar Filtro
          </button>

          <button
            onClick={onNewTrip}
            className="px-4 py-2 rounded font-medium bg-orange-500 text-white hover:bg-orange-600 shadow-sm"
          >
            Nuevo viaje
          </button>
        </div>

      </div>
    </div>
  );
};