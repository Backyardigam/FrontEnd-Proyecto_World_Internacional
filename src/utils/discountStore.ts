import { map } from "nanostores";
import { apiGet } from "./apiClient";
import type { Discount } from "./discountUtils";

/**
 * Representa la estructura de cada elemento en el array que devuelve la API /services/discount.
 */
export interface ApiDiscountResponse {
  id: string; // Corresponde al serviceId
  discounts: Discount | null; // El descuento puede ser un objeto o null si no hay
}

/**
 * El store que contendrá todos los descuentos.
 * Usamos un Record (objeto) para mapear serviceId -> Discount.
 * Esto permite un acceso O(1) a los descuentos, lo cual es muy eficiente.
 *
 * Ejemplo de estado:
 * {
 *   "cmi3f8s8m0002tg1i7cxkhvg6": { discountAmount: 20, ... },
 *   "cmi3f8sy80003tg1isivywlbm": { discountAmount: 20, ... }
 * }
 */
export const $discounts = map<Record<string, Discount>>({});

let hasFetched = false;

/**
 * Obtiene todos los descuentos de la API y los carga en el store.
 * Gracias a `hasFetched`, nos aseguramos de que esta llamada solo se haga una vez por carga de página.
 */
export async function fetchAllDiscounts() {
  if (hasFetched) return;

  try {
    const responseFromApi = await apiGet<ApiDiscountResponse[]>("/services/discount");
    const discountsMap: Record<string, Discount> = {};

    for (const item of responseFromApi) {
      // Si el objeto de descuento existe (no es null), lo añadimos al mapa
      if (item.discounts) {
        // CORRECCIÓN: Convertimos discountAmount de string a numero antes de guardarlo
        //OJOOOOOO: Esto deberia estar corregido en el backend pero fue p
        const cleanDiscount: Discount = {
          ...item.discounts,
          discountAmount: parseFloat(item.discounts.discountAmount as any),
        };

        discountsMap[item.id] = cleanDiscount;
      }
    }

    $discounts.set(discountsMap);
    hasFetched = true;
  } catch (error) {
    console.error("Error fetching discounts:", error);
  }
}
