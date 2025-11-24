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

  // Si los descuentos aún se están cargando, no renderizamos nada.
  // Esto asegura que el primer render en el cliente coincida con el del servidor (vacío),
  // evitando el error de hidratación.
  if (isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <DiscountTag original={originalPrice} discount={serviceDiscount} variant={variant} />
    </div>
  );
}