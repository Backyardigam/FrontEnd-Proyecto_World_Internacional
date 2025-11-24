import { getDiscountInfo, type Discount } from "../../utils/discountUtils";

interface DiscountInfo {
  original: number;
  discount?: Discount;
}

/**
 * Componente que muestra el precio de un servicio, aplicando visualmente
 * un descuento si existe y está activo.
 * @param original El precio original del servicio.
 * @param discount El objeto de descuento opcional asociado al servicio.
 */
export default function DiscountTag({ original, discount }: DiscountInfo) {
  const discountInfo = getDiscountInfo(original, discount);
  const { isActive, finalPrice, percent } = discountInfo;

  // Caso sin descuento
  if (!isActive) {
    return <span className="text-lg font-semibold">S/ {original}</span>;
  }

  // 1) Descuento pequeño (0–10%)
  if (percent < 10) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold text-green-600">
          S/ {finalPrice}
        </span>
        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-[2px] rounded">
          Oferta
        </span>
      </div>
    );
  }

  // 2) Descuento medio (10–25%)
  if (percent < 25) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="line-through text-gray-400 text-sm">
          S/ {original}
        </span>
        <span className="text-lg font-semibold text-green-600">
          S/ {finalPrice}
        </span>
      </div>
    );
  }

  // 3) Descuento grande (> 25%)
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="line-through text-gray-400 text-sm">
          S/ {original}
        </span>
        <span className="text-xl font-semibold text-green-600">
          S/ {finalPrice}
        </span>
      </div>
      <span className="text-sm bg-red-600 text-white px-2 py-[3px] rounded font-semibold">
        -{percent}%
      </span>
    </div>
  );
}
