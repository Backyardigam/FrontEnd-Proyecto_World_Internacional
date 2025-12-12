//=========================================
//Nuevas interfaces para el hosted checkout
//=========================================
export type PaymentStatus='PENDING'|'PAID'|'FAILED'|'CANCELLED'|'EXPIRED';

// Salidas Frontend ->> Backend   =========

// Datos que llegan del formulario
export interface TicketItemInput {
  serviceId: string;       // ID del servicio (CUID)
  peopleCount: number;     // Cantidad de pasajeros
  price: number;           // Precio unitario referencial (Backend valida el real)
  date: string;            // Fecha del tour (YYYY-MM-DD)
  schedule: string;        // Hora (HH:mm:ss)

  name: string;
  email: string;
  phoneNumber: string;
  seatID?: string[];       // Para selección de asientos (si aplica)
  orderBus?: string;       // Para selección de bus (si aplica)
}

// Datos que hay que inferir y transformar para el checkout de izipay
export interface BuyerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  // Datos importantes para Izipay Checkout (Billing):
  documentType?: 'DNI' | 'RUC' | 'CE' | 'PASAPORTE'; 
  documentNumber?: string;
  address?: string; // Opcional, pero ayuda a evitar rechazos bancarios
}

// El cuerpo del POST /api/create-payment
export interface CreatePaymentRequest {
  buyerInfo: BuyerInfo;
  tickets: TicketItemInput[];
}

// Salidas Backend ->> Frontend  ========================

export interface CreatePaymentResponse {
  success: boolean;
  
  // Datos vitales para Izipay
  formToken: string;       // El token encriptado que genera Izipay
  orderId: string;         // Tu UUID (cuid) generado en Prisma
  
  // Datos de contexto (opcional, por si quieres mostrar resumen antes de redirigir)
  totalAmount: number;     // El monto total calculado por el backend
  currency: string;        // "PEN"
}

// --- Contratos para el Web Polling del estado del pago ---

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

// Respuesta que espera el frontend para la renderizacion de boletos
export interface TicketData {
  ticketCode: string;
  peopleCount: number;
  name: string;
  phoneNumber: string;
  email: string;
  schedule: string;
  date: string;
  orderBus?: string;
  seats?: string[];
  totalCost: number;
  createdAt: string;
  service: string;
}

// Interfaz para los datos del boleto que esperamos de la API
export interface TicketSummary {
  id: string;
  ticketCode: string;
  name: string;
  service: string;
  date: string;
  schedule: string;
  peopleCount: number;
}