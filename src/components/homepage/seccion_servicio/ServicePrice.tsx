import React from "react";
import { useStore } from "@nanostores/react";
import { $discounts, $discountsLoading } from "../../../utils/discountStore";
import DiscountTag from "../../generales/DiscountTag";

interface ServicePriceProps {
  serviceId: string;
  originalPrice: number;
  variant?: "full" | "compact" | "minimal";
}

/**
 * Componente cliente que se conecta al store de descuentos
 * para renderizar el precio de un servicio, aplicando el
 * DiscountTag si corresponde.
 */
export default function ServicePrice({ serviceId, originalPrice, variant }: ServicePriceProps) {
  const allDiscounts = useStore($discounts);
  const isLoading = useStore($discountsLoading);
  const serviceDiscount = allDiscounts[serviceId];

  // Si los descuentos aún se están cargando, mostramos el precio original como placeholder.
  // Esto evita el error de hidratación y el "layout shift" (salto de diseño).
  // Cuando isLoading cambie a false, el hook `useStore` provocará un re-render con el precio final.
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <span className="text-lg font-semibold text-gray-800 animate-pulse">
          S/ {originalPrice.toFixed(2)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <DiscountTag original={originalPrice} discount={serviceDiscount} variant={variant} />
    </div>
  );
}