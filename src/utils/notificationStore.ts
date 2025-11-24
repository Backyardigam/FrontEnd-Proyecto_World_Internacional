import { atom } from "nanostores";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number; // Duración en ms
}

// La tienda contendrá un array de notificaciones activas.
export const $notifications = atom<Notification[]>([]);

/**
 * Añade una nueva notificación a la lista.
 * @param message El mensaje a mostrar.
 * @param type El tipo de notificación (success, error, etc.).
 * @param duration Cuánto tiempo debe mostrarse la notificación en ms.
 */
export function addNotification(
  message: string,
  type: NotificationType,
  duration: number = 5000
) {
  const id = Date.now() + Math.random();
  const currentNotifications = $notifications.get();

  $notifications.set([...currentNotifications, { id, message, type, duration }]);

  // Programar la eliminación automática de la notificación
  setTimeout(() => {
    removeNotification(id);
  }, duration);
}

export function removeNotification(id: number) {
  const updatedNotifications = $notifications.get().filter((n) => n.id !== id);
  $notifications.set(updatedNotifications);
}