import React, { useMemo, useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cart } from "../../../utils/cartStore";
import CartItemCard from "./CartItemCard";
import { IzipayButton } from "../IziPayButton";
import type { BuyerInfo, TicketItemInput } from "../utils/payment.contract";
import { $discounts } from "../../../utils/discountStore";
import { getDiscountInfo } from "../../../utils/discountUtils";

export default function CheckoutPage() {
  const cart = useStore($cart);
  const allDiscounts = useStore($discounts);
  
  // Estados para almacenar los datos que se pasarán al botón de pago
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo | null>(null);
  const [tickets, setTickets] = useState<TicketItemInput[]>([]);

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const subtotal = useMemo(() => {
    // Recalculamos el subtotal real considerando los descuentos y sus stocks
    return cart.items.reduce((acc, item) => {
      const itemDiscount = allDiscounts[item.uuid];
      const discountInfo = getDiscountInfo(item.price, itemDiscount);
      const stockLimit = itemDiscount?.discountStock;

      const applyDiscount = discountInfo.isActive && (
      stockLimit === null || (typeof stockLimit === 'number' && item.quantity <= stockLimit)
    );

      const finalPricePerUnit = applyDiscount
        ? discountInfo.finalPrice
        : item.price;

      return acc + finalPricePerUnit * item.quantity;
    }, 0);
  }, [cart.items]);

  const allFormsFilled = useMemo(() => {
    return cart.items.every((item) => item.status === "filled");
  }, [cart.items]);

  // Efecto para preparar los datos para el botón de pago cada vez que el carrito cambie
  useEffect(() => {
    if (cart.items.length > 0 && allFormsFilled) {
      const firstItem = cart.items[0];
      const buyerData = firstItem.buyerData!;
      const fullName = buyerData.nombreCompleto || "";
      const firstName = fullName.split(" ")[0] || "";
      const lastName = fullName.split(" ").slice(1).join(" ") || "";

      setBuyerInfo({
        email: buyerData.correo || "",
        firstName: firstName,
        lastName: lastName,
        phoneNumber: buyerData.celular,
        // documentType: buyerData.tipoDocumento,
        // documentNumber: buyerData.numeroDocumento,
      });

      setTickets(cart.items.map((item) => {
        // Reutilizamos la misma lógica de cálculo de precio para el payload
        const itemDiscount = allDiscounts[item.uuid];
        const discountInfo = getDiscountInfo(item.price, itemDiscount);
        const stockLimit = itemDiscount?.discountStock;
        const applyDiscount = discountInfo.isActive && (
      stockLimit === null || (typeof stockLimit === 'number' && item.quantity <= stockLimit)
    );
        const finalPricePerUnit = applyDiscount ? discountInfo.finalPrice : item.price;

        const scheduleTime = item.horario ? item.horario.split(" - ")[0] : "00:00"; // "10:00"
        const scheduleHHMMSS = `${scheduleTime}:00`;

        return {
          serviceId: item.uuid,
          peopleCount: item.quantity,
          price: finalPricePerUnit, // ¡Importante! Enviamos el precio final unitario
          date: item.fecha || new Date().toISOString().split("T")[0],
          schedule: scheduleHHMMSS,
          name: item.buyerData?.nombreCompleto || "",
          email: item.buyerData?.correo || "",
          phoneNumber: item.buyerData?.celular || "",
        };
      }));
    } else {
      setBuyerInfo(null);
      setTickets([]);
    }
  }, [cart.items, allFormsFilled]);

  // Durante el renderizado del servidor y el primer renderizado del cliente,
  // hasMounted es false, por lo que siempre se mostrará la vista de "carrito vacío",
  // evitando el error de hidratación.
  if (!hasMounted || cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700">
          Tu carrito está vacío
        </h2>
        <p className="text-gray-500 mt-2">
          Parece que aún no has añadido ningún servicio.
        </p>
        <a
          href="/servicios"
          className="mt-6 inline-block bg-naranja-c text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-naranja-f"
        >
          Ver Servicios
        </a>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pt-24 md:p-10 md:pt-25 font-redhat">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
        Mi Carrito de Compras
      </h1>
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
            <h2 className="text-2xl font-bold border-b pb-4 mb-4">
              Resumen del Pedido
            </h2>
            <div className="space-y-3">
              {cart.items.map((item) => {
                // Reutilizamos la misma lógica de cálculo de precio para el resumen
                const itemDiscount = allDiscounts[item.uuid];
                const discountInfo = getDiscountInfo(item.price, itemDiscount);
                const stockLimit = itemDiscount?.discountStock;
                const applyDiscount =
                  discountInfo.isActive &&
                  (stockLimit === null ||
                    (typeof stockLimit === "number" &&
                      item.quantity <= stockLimit));
                const finalPricePerUnit = applyDiscount
                  ? discountInfo.finalPrice
                  : item.price;
                const itemTotal = finalPricePerUnit * item.quantity;

                return (
                  <div key={item.id} className="flex justify-between text-gray-700">
                    <span className="truncate pr-2">{`${item.serviceName} x${item.quantity}`}</span>
                    <span className="font-medium">S/ {itemTotal.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between font-bold text-xl border-t pt-4 mt-4">
                <span>Total</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6">
              {buyerInfo && tickets.length > 0 && (
                <IzipayButton
                  buyerInfo={buyerInfo}
                  tickets={tickets}
                  disabled={!allFormsFilled}
                />
              )}
              {!allFormsFilled && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  Completa todos los campos para poder pagar.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
