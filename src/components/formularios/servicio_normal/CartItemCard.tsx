import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import type { CartItem, PassengerFormData } from "../../../utils/cartStore";
import {
  updateItemDetails,
  removeServiceFromCart,
  updateServiceQuantity,
} from "../../../utils/cartStore";
import { $discounts } from "../../../utils/discountStore";
import DiscountTag from "../../generales/DiscountTag";
import Formulario from "../servicio_mirabus/Formulario";

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const allDiscounts = useStore($discounts);
  const itemDiscount = allDiscounts[item.id];

  const [fecha, setFecha] = useState(item.fecha || "");
  const [horario, setHorario] = useState(item.horario || "");
  const [buyerData, setBuyerData] = useState<PassengerFormData | null>(
    item.buyerData
  );

  // Cuando los datos del formulario cambian, actualizamos el store de nanostores.
  useEffect(() => {
    // Usamos un timeout para no actualizar el store en cada pulsación de tecla (debounce)
    const handler = setTimeout(() => {
      updateItemDetails(item.id, {
        fecha,
        horario,
        buyerData,
      });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [fecha, horario, buyerData, item.id]);

  const handleRemove = () => {
    if (window.confirm(`¿Seguro que quieres eliminar "${item.serviceName}" del carrito?`)) {
      removeServiceFromCart(item.id);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity > 0) {
      updateServiceQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <img src={item.urlImagen} alt={item.serviceName} className="w-full md:w-48 h-32 object-cover rounded-md" />
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800 pr-4">{item.serviceName}</h3>
            <button onClick={handleRemove} className="text-red-500 hover:text-red-700 font-semibold">
              Eliminar
            </button>
          </div>
          <div className="mt-1">
            <DiscountTag original={item.price} discount={itemDiscount} variant="compact" />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor={`fecha-${item.id}`} className="block text-sm font-medium text-gray-700">Fecha del Tour</label>
              <input
                type="date"
                id={`fecha-${item.id}`}
                value={fecha}
                min={new Date().toISOString().split("T")[0]} 
                max={new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label htmlFor={`horario-${item.id}`} className="block text-sm font-medium text-gray-700">Horario</label>
              <select
                id={`horario-${item.id}`}
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="" disabled>Selecciona un horario</option>
                {item.availableSchedules && Object.values(item.availableSchedules).map(schedule => (
                  <option 
                    key={schedule.startTrip} 
                    value={`${schedule.startTrip} - ${schedule.endTrip}`}>
                      {schedule.startTrip} - {schedule.endTrip}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700">Pasajeros</label>
              <input
                type="number"
                id={`quantity-${item.id}`}
                value={item.quantity}
                onChange={handleQuantityChange}
                min="1"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 border-t pt-4">
        <Formulario onFormDataChange={setBuyerData} />
      </div>
    </div>
  );
}