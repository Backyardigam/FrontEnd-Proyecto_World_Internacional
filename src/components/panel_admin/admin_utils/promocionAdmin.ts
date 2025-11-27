/**
 * Representa un servicio básico tal como se obtiene de la lista /manage/services/
 */
export interface IServiceListItem {
  id: string;
  id_name: string;
  name: string;
  cost: string;
  type: "tour" | "mirabus";
  serviceState: "visible" | "hidden";
}

/**
 * Representa el payload para GET, POST y PUT en /manage/promotion/{id}
 */
export interface IPromotion {
  discountAmount: string;
  discountExpiration: string; // Formato YYYY-MM-DD
  discountStock: number | null;
}

/**
 * Estructura de datos combinada para usar en la vista de Promociones.
 */
export interface IServiceWithPromotion extends IServiceListItem {
  promotion: IPromotion | null;
}