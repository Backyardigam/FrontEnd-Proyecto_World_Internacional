import { addServiceToCart, clearCart, type Service } from "../../utils/cartStore";
import { addNotification } from "../../utils/notificationStore";
import { $auth } from "../../utils/authStore";
import type { Schedule } from "../../components/homepage/seccion_servicio/services";



/**
 * Maneja la acción de añadir un servicio al carrito de compras y notifica al usuario.
 * @param service - Un objeto `Service` que contiene los detalles del servicio.
 * @param service.id - El ID del servicio.
 * @param service.name - El nombre del servicio.
 * @param service.price - El precio del servicio.
 */
export function handleAddToCart(service: Service) {
  addServiceToCart(service);
  addNotification(`"${service.name}" añadido al carrito.`, "success");
}

/**
 * Maneja la acción de añadir un servicio al carrito y redirige inmediatamente
 * a la página de reserva/checkout.
 * @param service - El objeto del servicio a añadir.
 */
export function handleReserveNow(service: Service) { 
  const { isAuthenticated } = $auth.get();

  if (isAuthenticated) {
    addServiceToCart(service);
    window.location.href = "/reservar";
  } else {
    window.location.href = "/login?redirect=/reservar";
  }
}

/**
 * Maneja la reserva de un servicio tipo Mirabus, verificando la autenticación.
 * @param serviceIdName - El id_name del servicio para la URL.
 */
export function handleReserveMirabus(serviceIdName: string) {
  const { isAuthenticated } = $auth.get();

  if (isAuthenticated) {
    // Si está autenticado, va directo al formulario
    window.location.href = `/reservar/formirabus?servicio=${serviceIdName}`;
  } else {
    // Si no, guarda la intención de ir al formulario y redirige a login
    window.location.href = "/login?redirect=/formirabus?servicio=${serviceIdName}";
  }
}