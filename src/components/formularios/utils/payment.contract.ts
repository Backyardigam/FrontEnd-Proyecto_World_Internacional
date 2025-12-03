// ==========================================================================================
// CONTRATOS DE PAGO: FLUJO DE DATOS ENTRE FRONTEND Y BACKEND
//
// Este archivo define las estructuras de datos (contratos) para el proceso de pago.
// El flujo general es:
// 1. FRONTEND: Recopila los datos del carrito/reserva y los empaqueta en un `CreatePaymentRequest`.
// 2. FRONTEND -> BACKEND: Envía la petición POST a `/api/create-payment`.
// 3. BACKEND -> FRONTEND: Responde con un `CreatePaymentResponse` que contiene el `formToken` de Izipay.
// 4. FRONTEND: Utiliza el `formToken` para mostrar el formulario de pago de Izipay.
// 5. USUARIO: Paga y es redirigido a una página de confirmación en nuestro sitio.
// 6. FRONTEND (Página de Confirmación): Realiza polling al backend para verificar el estado del pago usando `PaymentStatusResponse`.
// ==========================================================================================

// Datos requeridos para crear UN ticket individual
export interface TicketInput {
  serviceId: string;       // ID del servicio turístico
  name: string;            // Nombre del pasajero principal del ticket
  email: string;           // Email para este ticket específico
  phoneNumber: string;     // Numero
  peopleCount: number;     // Cantidad de personas en este ticket
  date: string;            // ISO String (YYYY-MM-DD)
  schedule: string;        // Hora (HH:mm:ss) o string representativo
  seatID?:string[];        // Si es un servicio Mirabus, se manda tambien la relacion de asientos que selecciono
  orderBus?:string;        // El bus que le corresponde
}

// --- PASO 1: CONSTRUCCIÓN DEL PAYLOAD EN EL FRONTEND ---
// El frontend (tanto `FormularioMirabus.tsx` como `CheckoutPage.tsx`) debe construir este objeto.
// - En `FormularioMirabus.tsx`, el array `tickets` contendrá un solo elemento.
// - En `CheckoutPage.tsx`, el array `tickets` contendrá un elemento por cada item en el carrito de nanostores.
// - `buyerInfo` se puede construir a partir de los datos del primer formulario o del usuario logueado.
//
// El cuerpo del POST /api/create-payment
export interface CreatePaymentRequest {
  // Información del Comprador (quien paga)
  buyerInfo: {
    userId: string;       // Opcional: Si está logueado
    email: string;         // Obligatorio: Para enviar el recibo y para Izipay
    firstName?: string;    // Útil para pre-llenar datos en Izipay
    lastName?: string;     // Útil para pre-llenar datos en Izipay
  };

  // El contenido del carrito
  tickets: TicketInput[];
}

// --- PASO 3: RESPUESTA DEL BACKEND AL FRONTEND ---
// El frontend recibe este objeto. El `formToken` es la pieza clave que se necesita para
// inicializar el formulario de pago de Izipay en el cliente.
// Respuesta al FrontEnd despues del POST
export interface CreatePaymentResponse {
  success: boolean;
  
  // Datos vitales para Izipay
  formToken: string;       // El token encriptado que genera Izipay
  orderId: string;         // Tu UUID (cuid) generado en Prisma
  
  // Datos de contexto (opcional, por si quieres mostrar resumen antes de redirigir)
  totalAmount: number;     // El monto total calculado por el backend
  currency: string;        // "PEN"
}

// ==========================================================================================
// ESTRUCTURAS INTERNAS (Referencia para el Backend)
// ==========================================================================================

// Estructura oficial del Body para POST /Charge/CreatePayment
export interface IzipayCreatePaymentPayload {
  amount: number;         // Obligatorio: Monto en CÉNTIMOS (Entero)
  currency: string;       // "PEN" o "USD"
  orderId: string;        // Tu UUID generado
  
  // Datos del Cliente (Ayuda a Izipay a detectar fraudes y pre-llenar campos)
  customer: {
    email: string;
    billingDetails?: {
      firstName?: string;
      lastName?: string;
      cellPhoneNumber?: string;
      // Se pueden agregar address, city, etc. si los tienes
    };
    reference?: string; // ID interno de tu usuario (opcional)
  };

  // Configuración de la Redirección (Hosted Checkout)
  vads_url_return: string; 
  vads_return_mode: "GET" | "POST"; 
  
  // Metadatos opcionales (viajan de ida y vuelta en el webhook)
  metadata?: Record<string, string>; 
}


// ==========================================================================================
// --- Contratos para el Web Polling del estado del pago ---
// --- PASO 6: VERIFICACIÓN DEL ESTADO DEL PAGO ---
// En la página de "Gracias por tu compra" o "Procesando pago", el frontend hará peticiones GET a una ruta como `/api/payment-status/{orderId}` para saber si el pago se completó. El backend responderá con una de estas estructuras.

// 1. Respuesta cuando el pago está PENDIENTE
export interface PendingPaymentResponse {
  orderId: string;
  status: 'PENDING';
}

// 2. Respuesta cuando el pago fue EXITOSO
export interface PaidPaymentResponse {
  orderId: string;
  status: 'PAID';
}

// 3. Respuesta cuando el pago FALLÓ o fue CANCELADO
export interface FailedPaymentResponse {
  orderId: string;
  status: 'FAILED' | 'CANCELLED' | 'EXPIRED';
}

// El tipo de unión que el frontend recibirá. TypeScript sabrá qué campos esperar según el `status`.
export type PaymentStatusResponse = PendingPaymentResponse | PaidPaymentResponse | FailedPaymentResponse;
