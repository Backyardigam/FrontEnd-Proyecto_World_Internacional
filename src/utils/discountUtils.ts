export interface Discount {
  discountAmount: number; //Cantidad que se descuenta digamos 10; 50(precio normal)-10(discounAmount)=40(Precio final)
  discountExpiration?: string; // Fecha de expiración en formato string (ej: "2025-12-04T00:00:00.000Z")
  discountStock?: number; //Cantidad de productos a los que se le aplica el descuento
}

/**
 * Funcion que normaliza los datos que llegan del endpoint de /services/discount
 * @param originalPrice 
 * @param discount 
 * @returns 
 */
export function getDiscountInfo(originalPrice: number, discount?: Discount) {
  // Si no hay descuento, o el monto es 0 o negativo, no está activo.
  if (!discount || discount.discountAmount <= 0) {
    return {
      isActive: false,
      finalPrice: originalPrice,
      percent: 0,
      expirationMessage: null,
      expired: false,
    };
  }

  const now = new Date();
  // Si no hay fecha de expiración, asumimos que nunca expira.
  let expirationDate: Date | null = null;
  if (discount.discountExpiration) {
    // IMPORTANTE: Al crear la fecha desde un string 'YYYY-MM-DD', se interpreta como UTC midnight.
    // Para evitar problemas de zona horaria, añadimos 'T23:59:59' para que la oferta
    // sea válida durante todo el día de expiración, sin importar la zona horaria del usuario.
    expirationDate = new Date(`${discount.discountExpiration}T23:59:59`);
  }

  const hasExpired = expirationDate ? now > expirationDate : false;
  
  // El stock es válido si es null (ilimitado) o mayor que 0.
  const hasStock = discount.discountStock === null || (discount.discountStock !== undefined && discount.discountStock > 0);

  const isActive = !hasExpired && hasStock;

  const finalPrice = isActive
    ? Math.max(originalPrice - discount.discountAmount, 0)
    : originalPrice;

  const percent = isActive
    ? Math.round((discount.discountAmount / originalPrice) * 100)
    : 0;

  let expirationMessage: string | null = null;
  if (isActive) {
    if (expirationDate) {
      const day = expirationDate.getDate().toString().padStart(2, '0');
      const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0'); // getMonth() es 0-indexed
      const year = expirationDate.getFullYear();
      expirationMessage = `Oferta disponible hasta el ${day}/${month}/${year}`;
    }
  }

  return {
    isActive,
    expired: hasExpired,
    finalPrice,
    percent,
    expirationMessage,
  };
}
