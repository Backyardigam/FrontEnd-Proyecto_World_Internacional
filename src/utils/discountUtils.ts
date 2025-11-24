export interface Discount {
  discountAmount: number; //Cantidad que se descuenta digamos 10; 50(precio normal)-10(discounAmount)=40(Precio final)
  discountExpiration: string; // Fecha de expiración en formato string (ej: "2025-12-04T00:00:00.000Z")
  discountStock: number; //Cantidad de productos a los que se le aplica el descuento
}

/**
 * Funcion que normaliza los datos que llegan del endpoint de /services/discount
 * @param originalPrice 
 * @param discount 
 * @returns 
 */
export function getDiscountInfo(originalPrice: number, discount?: Discount) {
  if (!discount) {
    return {
      isActive: false,
      finalPrice: originalPrice,
      percent: 0,
      expiresSoon: false,
      expired: false,
    };
  }

  const now = new Date();
  const expirationDate = new Date(discount.discountExpiration);

  const expired = now > expirationDate;
  const isActive = !expired && discount.discountStock > 0;

  const finalPrice = isActive
    ? Math.max(originalPrice - discount.discountAmount, 0)
    : originalPrice;

  const percent = isActive
    ? Math.round((discount.discountAmount / originalPrice) * 100)
    : 0;

  const expiresSoon =
    isActive &&
    expirationDate.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 3; // <3 días

  return {
    isActive,
    expired,
    finalPrice,
    percent,
    expiresSoon,
  };
}
