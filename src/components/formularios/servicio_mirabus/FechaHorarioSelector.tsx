// SelectorFechaHorario.tsx
import React from "react";
import { useState, useEffect } from "react";

interface FechaHorarioSelectorProps {
  onSelectionChange: (fecha: string, horario: string) => void;
  fetchHorarios: (fecha: string) => Promise<string[]>; // función opcional para obtener horarios disponibles
}

export function FechaHorarioSelector({
  onSelectionChange,
  fetchHorarios,
}: FechaHorarioSelectorProps) {
  const [fecha, setFecha] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [horario, setHorario] = useState("");

  useEffect(() => {
    if (fecha) {
      fetchHorarios(fecha).then(setHorarios);
    }
  }, [fecha]);

  useEffect(() => {
    if (fecha && horario) {
      onSelectionChange(fecha, horario);
    }
  }, [fecha, horario]);

  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="border rounded p-2"
        min={new Date().toISOString().split("T")[0]} 
        max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
      />
      <select
        value={horario}
        onChange={(e) => setHorario(e.target.value)}
        className="border rounded p-2"
      >
        <option value="">Selecciona un horario</option>
        {horarios.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
