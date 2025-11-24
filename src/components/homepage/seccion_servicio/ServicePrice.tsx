import React from "react";
import { useStore } from "@nanostores/react";
import { $discounts } from "../../../utils/discountStore";
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
  const serviceDiscount = allDiscounts[serviceId];

  return (
    <div className="flex flex-col">
      <DiscountTag original={originalPrice} discount={serviceDiscount} variant={variant} />
    </div>
  );
}