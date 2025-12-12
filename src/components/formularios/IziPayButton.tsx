import React, { useState, useEffect } from 'react';
import type { BuyerInfo, CreatePaymentRequest, CreatePaymentResponse, TicketItemInput } from './utils/payment.contract';
import { apiPost } from '../../utils/apiClient';

interface PaymentButtonProps {
  buyerInfo: BuyerInfo;
  tickets: TicketItemInput[];
  disabled?: boolean;
}

/**
 * Un botón que encapsula toda la lógica para iniciar el proceso de pago
 * con el Hosted Checkout de Izipay.
 */
export const IzipayButton = ({ buyerInfo, tickets, disabled = false }: PaymentButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayClick = async () => {
    setIsLoading(true);
    setPaymentError(null);

    try {
      // 1. LLAMADA AL BACKEND (Pedir formToken)
      const payload: CreatePaymentRequest = { buyerInfo, tickets };
      
      const response = await apiPost<CreatePaymentResponse>(
        "/boletos/payment",
        payload
      );

      // Verificamos si la respuesta fue exitosa y tenemos el formToken
      if (response.success && response.formToken) {
        setFormToken(response.formToken);
        // El formulario se renderizará automáticamente gracias al useEffect
      } else {
        throw new Error("No se pudo generar el token de pago.");
      }

    } catch (error: any) {
      console.error("Error al iniciar el pago:", error);
      setPaymentError(error.message || "Hubo un error al procesar tu solicitud.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // @ts-ignore
    if (formToken && window.KR) {
      // 2. Inyectar Token en Izipay (Lyra)
      // @ts-ignore
      window.KR.setFormToken(formToken)
        // @ts-ignore
        .then(({ KR }) => KR.render()) // Esto dibuja el formulario Neon
        .then(() => console.log("Formulario Izipay listo"));
    }
  }, [formToken]);

  return (
    <div className="w-full">
      {!formToken ? (
        <>
          <button
            onClick={handlePayClick}
            disabled={isLoading || disabled}
            className="w-full text-white font-bold py-3 rounded-lg transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Cargando pasarela..." : "Pagar Ahora con Izipay"}
          </button>
          {paymentError && (
            <p className="text-sm text-center text-red-600 mt-2">
              <strong>Error:</strong> {paymentError}
            </p>
          )}
        </>
      ) : (
        // AQUÍ IZIPAY DIBUJARÁ EL FORMULARIO NEON
        // La clase 'kr-embedded' le dice a Izipay dónde pintar
        <div className="kr-smart-form" kr-popin kr-form-token={formToken}></div>
      )}
    </div>
  );
};