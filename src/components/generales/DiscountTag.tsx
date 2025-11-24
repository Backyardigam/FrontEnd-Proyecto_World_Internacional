import { getDiscountInfo, type Discount } from "../../utils/discountUtils";

interface DiscountInfo {
  original: number;
  discount?: Discount;
  variant?: "full" | "compact" | "minimal";
}

/**
 * Componente que muestra el precio de un servicio, aplicando visualmente
 * un descuento si existe y está activo.
 * @param original El precio original del servicio.
 * @param discount El objeto de descuento opcional asociado al servicio.
 * @param variant Controla el nivel de detalle: 'full' (default), 'compact', o 'minimal'.
 */
export default function DiscountTag({
  original,
  discount,
  variant = "full",
}: DiscountInfo) {
  const discountInfo = getDiscountInfo(original, discount);
  const { isActive, finalPrice, percent, expirationMessage, expired } = discountInfo;

  // --- Caso 1: Sin descuento activo ---
  if (!isActive) {
    return (
      <span className="text-lg font-semibold text-gray-800">
        S/ {original.toFixed(2)}
      </span>
    );
  }

  // --- Caso 2: Con descuento activo ---

  // Variable para almacenar el mensaje de urgencia/escasez.
  // Esto evita re-declarar un componente en cada render.
  let urgencyMessageElement = null;
  if (variant === "full" && discount) {
    if (discount.discountStock <= 5) {
      urgencyMessageElement = (
        <p className="text-xs text-red-600 font-medium mt-1">
          ¡Solo quedan {discount.discountStock} cupos en oferta!
        </p>
      );
    } else if (expirationMessage) {
      urgencyMessageElement = (
        <p className="text-xs text-orange-600 font-medium mt-1">{expirationMessage}</p>
      );
    }
  }

  // --- Renderizado según la variante ---

  if (variant === "minimal") {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-green-600">
          S/ {finalPrice.toFixed(2)}
        </span>
        <span className="line-through text-gray-400 text-sm">
          S/ {original.toFixed(2)}
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-end">
        <span className="text-lg font-semibold text-gray-900">
          S/ {finalPrice.toFixed(2)}
        </span>
        <span className="line-through text-gray-500 text-sm">
          S/ {original.toFixed(2)}
        </span>
      </div>
    );
  }

  // variant="full" (default)
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="line-through text-gray-400 text-sm">
            S/ {original.toFixed(2)}
          </span>
          <span className="text-2xl font-bold text-green-600">
            S/ {finalPrice.toFixed(2)}
          </span>
        </div>
        <span className="text-base bg-red-600 text-white px-2.5 py-1 rounded-md font-semibold">
          -{percent}%
        </span>
      </div>
      {urgencyMessageElement}
    </div>
  );
}
