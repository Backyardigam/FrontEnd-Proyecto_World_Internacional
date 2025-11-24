import React, { useMemo, useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cart } from "../../../utils/cartStore";
import CartItemCard from "./CartItemCard";

export default function CheckoutPage() {
  const cart = useStore($cart);

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

  const handleProceedToPayment = () => {
    if (!allFormsFilled) {
      alert("Por favor, completa todos los datos de cada servicio antes de continuar.");
      return;
    }
    // Aquí iría la lógica para enviar los datos al backend y redirigir a la pasarela de pago
    console.log("Procediendo al pago con los siguientes datos:", cart.items);
    alert("¡Todo listo! Redirigiendo a la pasarela de pago...");
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
            <button
              onClick={handleProceedToPayment}
              disabled={!allFormsFilled}
              className={`w-full mt-6 text-white font-bold py-3 rounded-lg transition-colors ${
                allFormsFilled
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Proceder al Pago
            </button>
            {!allFormsFilled && <p className="text-xs text-center text-gray-500 mt-2">Completa todos los campos para continuar.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}