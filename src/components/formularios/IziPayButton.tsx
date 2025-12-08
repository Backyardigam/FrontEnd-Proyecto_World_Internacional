import React, { useState } from 'react';
import type { BuyerInfo, CreatePaymentRequest, IzipaySessionData,CreatePaymentResponse,  TicketItemInput } from './utils/payment.contract';
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
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayClick = async () => {
    setIsLoading(true);
    setPaymentError(null);

    try {
      // 1. LLAMADA AL BACKEND (Pedir Token y datos de la orden)
      const payload: CreatePaymentRequest = { buyerInfo, tickets };
      console.log("Ticket Data",payload)
      const response = await apiPost<CreatePaymentResponse>(
        "/boletos/payment",
        payload
      );

      if (!response.success || !response.data) {
        throw new Error(response.message || "Error al crear la orden de pago.");
      }

      const { token, merchantCode, orderId, amount, currency, customerContext, publicKey } = response.data;

      // @ts-ignore
      const Izipay = window.Izipay;
      if (!Izipay) {
        throw new Error("El SDK de Izipay no se ha cargado correctamente.");
      }

      const iziConfig = {
        action: Izipay.enums.payActions.PAY,
        merchantCode: merchantCode,
        order: {
          orderNumber: orderId,
          currency: currency,
          amount: amount,
          processType: Izipay.enums.processType.AUTHORIZATION,
          merchantBuyerId: merchantCode,
          dateTimeTransaction: new Date().getTime().toString(),
          payMethod: Izipay.enums.showMethods.ALL,
        },
        billing: {
          firstName: customerContext.firstName,
          lastName: customerContext.lastName,
          email: customerContext.email,
          documentType: customerContext.documentType,
          document: customerContext.documentNumber,
          phoneNumber: buyerInfo.phoneNumber || '999999999',
          street: buyerInfo.address || 'Calle no especificada',
          city: 'Lima',
          state: 'Lima',
          country: 'PE',
          postalCode: '15001',
        },
        render: {
          typeForm: Izipay.enums.typeForm.POP_UP,
          showButtonProcessForm: false,
        },
        appearance: {
          logo: "https://worldinternacional.com/assets/logo-color.png" // URL del logo
        }
      };

      // 3. INSTANCIAR Y CARGAR EL FORMULARIO POP-UP
      const checkout = new Izipay({ config: iziConfig });

      checkout.LoadForm({
        authorization: token,
        keyRSA: publicKey,
        callbackResponse: (response: any) => {
          console.log("Respuesta de Izipay:", response);
          setIsLoading(false);

          if (response.code === "00") {
            window.location.href = `/boleto/${orderId}?status=success`;
          } else {
            setPaymentError(`El pago no se completó. Motivo: ${response.message}`);
          }
        }
      });

    } catch (error: any) {
      console.error("Error al iniciar el pago:", error);
      setPaymentError(error.message || "Hubo un error al procesar tu solicitud.");
      setIsLoading(false);
    }
  };

  return (
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
  );
};