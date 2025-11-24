import { addServiceToCart, clearCart } from "../../utils/cartStore";
import { addNotification } from "../../utils/notificationStore";
import { $auth } from "../../utils/authStore";
import type { Schedule } from "../../components/homepage/seccion_servicio/services";

/**
 * Maneja la acción de añadir un servicio al carrito de compras y notifica al usuario.
 * @param service - Un objeto que contiene los detalles del servicio.
 * @param service.id - El ID del servicio.
 * @param service.name - El nombre del servicio.
 * @param service.price - El precio del servicio.
 */
export function handleAddToCart(service: {
  id: string;
  name: string;
  price: number;
  urlImagen:string;
  schedule: Schedule;
}) {
  addServiceToCart(service);
  addNotification(`"${service.name}" añadido al carrito.`, "success");
}

/**
 * Maneja la acción de añadir un servicio al carrito y redirige inmediatamente
 * a la página de reserva/checkout.
 * @param service - El objeto del servicio a añadir.
 */
export function handleReserveNow(service: {
  id: string;
  name: string;
  price: number;
  urlImagen: string;
  schedule: Schedule;
}) { 
  const { isAuthenticated } = $auth.get();

  if (isAuthenticated) {
    addServiceToCart(service);
    window.location.href = "/reservar";
  } else {
    // Guardamos la intención y redirigimos al login
    const postLoginAction = {
      action: "RESERVE_NOW",
      service: service,
    };
    sessionStorage.setItem("postLoginAction", JSON.stringify(postLoginAction));
    window.location.href = "/login";
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
    const postLoginAction = {
      action: "REDIRECT",
      url: `/reservar/formirabus?servicio=${serviceIdName}`,
    };
    sessionStorage.setItem("postLoginAction", JSON.stringify(postLoginAction));
    window.location.href = "/login";
  }
}