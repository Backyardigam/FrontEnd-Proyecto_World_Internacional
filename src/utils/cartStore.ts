import { persistentAtom } from "@nanostores/persistent";
import type { Schedule } from "../components/homepage/seccion_servicio/services";

// --- TIPOS DE DATOS --- 

export interface PassengerFormData {
  nombreCompleto: string;
  celular: string;
  dni: string;
  correo: string;
}

export type StatusItem = "pending" | "filled";

export interface CartItem {
  id: string; // ID único para este item en el carrito (ej: serviceId + timestamp)
  serviceId: string; // ID del servicio/producto
  serviceName: string; // Nombre para mostrar en la UI
  price: number; // Precio unitario
  urlImagen:string,
  availableSchedules: Schedule; // <-- NUEVA PROPIEDAD

  // Datos que se completarán en el formulario de checkout
  quantity: number;
  fecha: string | null;
  horario: string | null;
  buyerData: PassengerFormData | null; // <-- CAMBIO: Solo datos del comprador, no un array.

  // Estado para el flujo de llenado de formularios
  status: StatusItem;
}

export interface CartState {
  items: CartItem[];
}

// --- TIENDA (STORE) ---

// Creamos una tienda persistente. Nanostores se encargará de:
// 1. Leer el valor inicial desde localStorage con la clave 'cart'.
// 2. Guardar cualquier cambio en la tienda de vuelta a localStorage.
export const $cart = persistentAtom<CartState>(
  "cart",
  { items: [] },
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

// --- ACCIONES PARA MANIPULAR LA TIENDA ---

export function addServiceToCart(service: {
  id: string;
  name: string;
  price: number;
  urlImagen:string;
  schedule: Schedule; // <-- AÑADIMOS SCHEDULE
}) {
  const currentItems = $cart.get().items;

  const newItem: CartItem = {
    id: `${service.id}-${Date.now()}`,
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
    urlImagen:service.urlImagen,
    availableSchedules: service.schedule, // <-- GUARDAMOS LOS HORARIOS
    quantity: 1,
    fecha: null,
    horario: null,
    buyerData: null,
    status: "pending",
  };
  $cart.set({ items: [...currentItems, newItem] });
}

export function removeServiceFromCart(itemId: string) {
  const currentItems = $cart.get().items;
  $cart.set({ items: currentItems.filter((item) => item.id !== itemId) });
}

export function updateServiceQuantity(itemId: string, newQuantity: number) {
  if (newQuantity <= 0) {
    removeServiceFromCart(itemId);
    return;
  }
  const currentItems = $cart.get().items;
  const updatedItems = currentItems.map((item) =>
    item.id === itemId ? { ...item, quantity: newQuantity } : item
  );
  $cart.set({ items: updatedItems });
}

export function updateItemDetails(
  itemId: string,
  details: Partial<Omit<CartItem, "id" | "serviceId" | "serviceName" | "price">>
) {
  const statusp: StatusItem = "pending";
  const statusf: StatusItem = "filled";
  const currentItems = $cart.get().items;
  const updatedItems = currentItems.map((item) =>
    item.id === itemId
      ? {
          ...item,
          ...details,
          status: (details.buyerData && details.fecha && details.horario) ? statusf : statusp,
        }
      : item
  );
  $cart.set({ items: updatedItems });
}

export function clearCart() {
  $cart.set({ items: [] });
}
