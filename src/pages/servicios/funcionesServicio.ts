import { addServiceToCart } from "../../utils/cartStore";

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
}) {
  addServiceToCart(service);
  //cambiar por uno mejor
  alert(`"${service.name}" ha sido añadido al carrito.`);
}