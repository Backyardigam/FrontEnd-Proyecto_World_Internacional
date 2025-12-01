import React, { useState, useMemo, useEffect } from 'react';
import type { ISeatDistributionItem } from '../admin_utils/mirabusAdmin';

interface VehicleDesignerProps {
  initialDistribution?: ISeatDistributionItem[];
  onDistributionChange: (distribution: ISeatDistributionItem[]) => void;
}

export default function VehicleDesigner({ initialDistribution = [], onDistributionChange }: VehicleDesignerProps) {
  const [gridWidth, setGridWidth] = useState(8);
  const [gridHeight, setGridHeight] = useState(5);
  const [seats, setSeats] = useState<ISeatDistributionItem[]>(initialDistribution);

  // Sincroniza el estado interno si la prop inicial cambia (ej: al seleccionar otro bus para editar)
  useEffect(() => {
    setSeats(initialDistribution);

    // --- LÓGICA AÑADIDA ---
    // Si estamos cargando una distribución existente (modo edición)...
    if (initialDistribution && initialDistribution.length > 0) {
      // ...calculamos el ancho y alto máximo requerido para mostrar todos los asientos.
      const maxX = Math.max(...initialDistribution.map(seat => seat.x));
      const maxY = Math.max(...initialDistribution.map(seat => seat.y));
      setGridWidth(maxX);
      setGridHeight(maxY);
    } else {
      // Si estamos en modo creación (sin distribución inicial), reseteamos al tamaño por defecto.
      setGridWidth(8);
      setGridHeight(5);
    }

  }, [initialDistribution]);

  // El número del siguiente asiento a crear. Se calcula como el máximo número de asiento existente + 1.
  const nextSeatNumber = useMemo(() => {
    if (seats.length === 0) return 1;
    return Math.max(...seats.map(s => s.id)) + 1;
  }, [seats]);

  const handleDimensionChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1 || numValue > 20) return; // Limites razonables

    // Guardamos los nuevos valores de ancho y alto
    const newWidth = dimension === 'width' ? numValue : gridWidth;
    const newHeight = dimension === 'height' ? numValue : gridHeight;

    if (dimension === 'width') {
      setGridWidth(numValue);
    } else {
      setGridHeight(numValue);
    }

    // Lógica CORREGIDA: Eliminar asientos que queden fuera de la nueva cuadrícula completa
    const filteredSeats = seats.filter(
      seat => seat.x <= newWidth && seat.y <= newHeight
    );

    if (filteredSeats.length !== seats.length) {
      setSeats(filteredSeats);
      onDistributionChange(filteredSeats);
    }
  };

  const handleCellClick = (x: number, y: number) => {
    const existingSeat = seats.find(seat => seat.x === x && seat.y === y);

    if (existingSeat) {
      // Si ya hay un asiento, lo eliminamos y re-numeramos los asientos posteriores.
      const idToRemove = existingSeat.id;
      const updatedSeats = seats
        .filter(seat => !(seat.x === x && seat.y === y)) // Elimina el asiento
        .map(seat => {
          // Si el número de este asiento es mayor que el del eliminado, réstale 1.
          if (seat.id > idToRemove) {
            return { ...seat, id: seat.id - 1 };
          }
          return seat;
        });
      setSeats(updatedSeats);
      onDistributionChange(updatedSeats);
    } else {
      // Si no hay asiento, creamos uno nuevo con el siguiente número disponible.
      const newSeat: ISeatDistributionItem = {
        id: nextSeatNumber,
        x,
        y,
      };
      const newSeats = [...seats, newSeat].sort((a, b) => a.id - b.id);
      setSeats(newSeats);
      onDistributionChange(newSeats);
    }
  };

  const handleClearAllSeats = () => {
    // Simplemente vacía el array de asientos.
    setSeats([]);
    onDistributionChange([]);
  };

  // Genera la cuadrícula para renderizar
  const grid = useMemo(() => {
    const gridLayout: (ISeatDistributionItem | null)[][] = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(null));

    seats.forEach(seat => {
      if (seat.y - 1 < gridHeight && seat.x - 1 < gridWidth) {
        gridLayout[seat.y - 1][seat.x - 1] = seat;
      }
    });
    return gridLayout;
  }, [gridWidth, gridHeight, seats]);

  // Genera el JSON de salida
  const outputJson = useMemo(() => {
    // Ordenamos los asientos por su número para que el JSON sea predecible.
    const sortedSeats = [...seats].sort((a, b) => a.id - b.id);
    const distribution: ISeatDistributionItem[] = sortedSeats.map(({ id, x, y }) => ({
      id,
      x,
      y,
    }));
    return JSON.stringify(distribution, null, 2);
  }, [seats]);

  return (
    <div className="space-y-6">
      {/* Controles de Dimensiones */}
      <div className="flex flex-wrap items-center gap-6 p-4 border rounded-lg bg-gray-50">
        <div>
          <label htmlFor="gridWidth" className="block text-sm font-medium text-gray-700">Ancho</label>
          <input
            type="number"
            id="gridWidth"
            value={gridWidth}
            onChange={(e) => handleDimensionChange('width', e.target.value)}
            className="w-24 p-2 mt-1 border border-gray-300 rounded-md"
            min="1"
            max="20"
          />
        </div>
        <div>
          <label htmlFor="gridHeight" className="block text-sm font-medium text-gray-700">Alto</label>
          <input
            type="number"
            id="gridHeight"
            value={gridHeight}
            onChange={(e) => handleDimensionChange('height', e.target.value)}
            className="w-24 p-2 mt-1 border border-gray-300 rounded-md"
            min="1"
            max="20"
          />
        </div>
        <div className="self-end">
          <button
            onClick={handleClearAllSeats}
            disabled={seats.length === 0}
            className="px-4 py-2 bg-red-500 text-white font-semibold rounded-md transition-colors
                       hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Limpiar todo
          </button>
        </div>
      </div>

      {/* Diseñador de Cuadrícula */}
      <div className="p-4 border rounded-lg inline-block">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((row, y) =>
            row.map((seat, x) => (
              <div
                key={`${x}-${y}`}
                onClick={() => handleCellClick(x + 1, y + 1)}
                className="w-12 h-12 flex items-center justify-center border border-dashed rounded-md cursor-pointer transition-colors
                           hover:bg-blue-100 hover:border-blue-400"
              >
                {seat ? (
                  <div className="w-10 h-10 bg-blue-500 text-white rounded flex items-center justify-center font-bold text-sm">
                    {seat.id}
                  </div>
                ) : (
                  <div className="w-10 h-10"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Salida JSON */}
      <details className="p-4 border rounded-lg bg-gray-50">
        <summary className="font-semibold text-lg cursor-pointer hover:text-blue-600">
          Ver Salida JSON (seatDistribution)
        </summary>
        <div className="mt-4">
          <pre className="p-4 bg-gray-800 text-white rounded-md text-sm overflow-x-auto">
            <code>{outputJson}</code>
          </pre>
        </div>
      </details>
    </div>
  );
}