import React, { createRef } from "react";
import { useStore } from "@nanostores/react";
import { $notifications, removeNotification, type Notification } from "../utils/notificationStore";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const icons: Record<Notification["type"], React.ReactNode> = {
  success: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  error: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
  warning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ),
};

const styles: Record<Notification["type"], string> = {
    success: 'bg-green-100 border-green-400 text-green-800',
    error: 'bg-red-100 border-red-400 text-red-800',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    info: 'bg-blue-100 border-blue-400 text-blue-800',
};


export default function NotificationsContainer() {
  const notifications = useStore($notifications);

  return (
    <div className="fixed top-20 right-0 p-4 space-y-3 z-[100]">
      <TransitionGroup>
        {notifications.map((notification) => (
          <CSSTransition
            key={notification.id}
            nodeRef={createRef<HTMLDivElement>()} // <-- Solución: Crear y pasar una referencia
            timeout={300}
            classNames="notification"
          >
            <div
              ref={createRef<HTMLDivElement>()} // <-- Solución: Asignar la referencia al div
              className={`max-w-sm w-full rounded-lg shadow-lg pointer-events-auto mb-2 border-l-4 p-4 flex items-start ${styles[notification.type]}`}
            >
              <div className="flex-shrink-0">{icons[notification.type]}</div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button onClick={() => removeNotification(notification.id)} className="inline-flex rounded-md text-current opacity-70 hover:opacity-100">
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
              </div>
            </div>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </div>
  );
}