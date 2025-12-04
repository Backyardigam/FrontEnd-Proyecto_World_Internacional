import React, { useMemo, useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cart } from "../../../utils/cartStore";
import CartItemCard from "./CartItemCard";
import { IzipayButton } from "../IziPayButton";
import type { CreatePaymentRequest, TicketInput, CreatePaymentResponse } from "../utils/payment.contract";
import { apiPost, ApiError } from "../../../utils/apiClient";

export default function CheckoutPage() {
  const cart = useStore($cart);

  const [isLoading, setIsLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const subtotal = useMemo(() => {
    return cart.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart.items]);

  const allFormsFilled = useMemo(() => {
    return cart.items.every(item => item.status === 'filled');
  }, [cart.items]);

  const handleProceedToPayment = async () => {
    setPaymentError(null); // Limpiar errores previos

    if (!allFormsFilled) {
      alert("Por favor, completa todos los datos de cada servicio antes de continuar.");
      return;
    }

    setIsLoading(true);

    // 1. Construir el payload según el contrato `CreatePaymentRequest`
    const firstItemBuyerData = cart.items[0]?.buyerData; // Datos del comprador del primer item

    const payload: CreatePaymentRequest = {
      buyerInfo: {
        // Asumimos que el comprador es la persona del primer formulario.
        // TODO: Si el usuario está logueado, usar sus datos.
        email: firstItemBuyerData?.correo || '',
        firstName: firstItemBuyerData?.nombreCompleto.split(' ')[0] || '',
        lastName: firstItemBuyerData?.nombreCompleto.split(' ').slice(1).join(' ') || ''
        // userId se podría obtener de la sesión del usuario
      },
      tickets: cart.items.map((item): TicketInput => {
        // El horario en el carrito es "HH:mm - HH:mm", el backend espera "HH:mm:ss"
        const scheduleStartTime = (item.horario || '').split(' - ')[0] + ':00';

        return {
          serviceId: item.id,
          name: item.buyerData?.nombreCompleto || '',
          email: item.buyerData?.correo || '',
          phoneNumber: item.buyerData?.celular || '',
          peopleCount: item.quantity,
          date: item.fecha || '',
          schedule: scheduleStartTime,
          // seatID y orderBus se enviarían si fuera un servicio Mirabus
        };
      }),
    };

    // Imprimimos en consola para revisión, como solicitaste.
    console.log("Payload para /boletos/payment:", JSON.stringify(payload, null, 2));
    
    try {
      // 2. Enviar los datos al backend usando el apiClient
      const data = await apiPost<CreatePaymentResponse>('/boletos/payment', payload);

      if (data.formToken) {
        console.log('Respuesta del backend:', data);
        setFormToken(data.formToken);
      }
    } catch (error: any) {
      console.error('Error al crear el pago:', error);
      // El ApiError ya tiene un mensaje claro del backend
      setPaymentError(error.message || 'Hubo un error al procesar tu solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  // Durante el renderizado del servidor y el primer renderizado del cliente,
  // hasMounted es false, por lo que siempre se mostrará la vista de "carrito vacío",
  // evitando el error de hidratación.
  if (!hasMounted || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700">Tu carrito está vacío</h2>
        <p className="text-gray-500 mt-2">Parece que aún no has añadido ningún servicio.</p>
        <a href="/servicios" className="mt-6 inline-block bg-naranja-c text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-naranja-f">
          Ver Servicios
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-24 md:p-10 md:pt-25 font-redhat">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">Mi Carrito de Compras</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna de Items */}
        <div className="lg:col-span-2 space-y-6 ">
          {cart.items.map((item) => (
            <CartItemCard key={item.id} item={item} />
          ))}
        </div>

        {/* Columna de Resumen */}
        <div className="lg:col-span-1 lg:pt-12">
          <div className="bg-white p-6 rounded-lg shadow-md sticky top-20">
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">Resumen del Pedido</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuestos (IGV 18%)</span>
                <span>S/ {(subtotal * 0.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4">
                <span>Total</span>
                <span>S/ {(subtotal * 1.18).toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-6">
              {formToken ? (
                // Si ya tenemos el token, mostramos el botón de Izipay
                <IzipayButton formToken={formToken} />
              ) : (
                // Si no, mostramos nuestro botón para confirmar la reserva
                <>
                  <button
                    onClick={handleProceedToPayment}
                    disabled={!allFormsFilled || isLoading}
                    className={`w-full text-white font-bold py-3 rounded-lg transition-colors ${
                      allFormsFilled && !isLoading
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? 'Procesando...' : 'Confirmar Reserva'}
                  </button>
                  {!allFormsFilled && <p className="text-xs text-center text-gray-500 mt-2">Completa todos los campos para continuar.</p>}
                </>
              )}
              {paymentError && (
                <p className="text-sm text-center text-red-600 mt-2">
                  <strong>Error:</strong> {paymentError}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}