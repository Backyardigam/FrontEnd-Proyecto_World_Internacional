import React from "react";
import { useState, useEffect } from "react";

interface FechaHorarioSelectorProps {
  schedules: string[]; // Ahora recibe los horarios como prop
  onSelectionChange: (fecha: string, horario: string) => void;
  disabled?: boolean;
}

export function FechaHorarioSelector({
  schedules,
  onSelectionChange,
  disabled = false,
}: FechaHorarioSelectorProps) {
  const [fecha, setFecha] = useState("");
  const [horario, setHorario] = useState("");

  useEffect(() => {
    if (fecha && horario) {
      onSelectionChange(fecha, horario);
    }
  }, [fecha, horario]);

  return (
    <div className="flex justify-between gap-5 items-center md:w-full md:px-9">
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="border rounded p-2 w-full bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
        min={new Date().toISOString().split("T")[0]} 
        max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
        disabled={disabled}
      />
      <select
        value={horario}
        onChange={(e) => setHorario(e.target.value)}
        className="border rounded p-2 w-full bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        <option value="">Selecciona un horario</option>
        {schedules.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
