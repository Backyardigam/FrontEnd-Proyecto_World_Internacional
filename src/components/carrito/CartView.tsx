import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $cart, removeServiceFromCart, updateServiceQuantity } from "../../utils/cartStore";
import { $auth } from "../../utils/authStore";
import { $discounts } from "../../utils/discountStore";
import { getDiscountInfo } from "../../utils/discountUtils";
import DiscountTag from "../generales/DiscountTag";

export default function CartView() {
  const { items } = useStore($cart);
  const { isAuthenticated } = useStore($auth);
  const allDiscounts = useStore($discounts);
  const [hasMounted, setHasMounted] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const subtotal = items.reduce((acc, item) => {
    const itemDiscount = allDiscounts[item.id];
    const { finalPrice } = getDiscountInfo(item.price, itemDiscount);
    return acc + finalPrice * item.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      window.location.href = "/login?redirect=/reservar";
    } else {
      window.location.href = "/reservar";
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setRemovingItemId(itemId);
    setTimeout(() => {
      removeServiceFromCart(itemId);
    }, 300); // Coincide con la duración de la animación
  };

  if (!hasMounted || items.length === 0) {
    return (
      <div className="text-center bg-white p-10 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700">Tu carrito está vacío</h2>
        <p className="text-gray-500 mt-2">
          Parece que aún no has añadido ningún servicio.
        </p>
        <a
          href="/servicios"
          className="mt-6 inline-block bg-naranja-c text-white font-bold py-2 px-6 rounded-lg hover:bg-naranja-f transition-colors"
        >
          Explorar Servicios
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center md:text-left">Tu Carrito</h1>
        <div className="bg-white shadow-lg rounded-lg">
            <ul role="list" className="divide-y divide-gray-200">
                {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col sm:flex-row py-6 px-4 sm:px-6 transition-opacity duration-300 ${
                    removingItemId === item.id ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                    <div className="flex-shrink-0">
                        <div className="max-w-24 max-h-24 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden">
                            <img src={item.urlImagen} alt="Imagen del servicio" className="w-full object-cover"/>
                        </div>
                    </div>

                    <div className="ml-0 sm:ml-6 mt-4 sm:mt-0 flex-1 flex flex-col">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-medium text-gray-900">{item.serviceName}</h3>
                            <div className="ml-4">
                                <DiscountTag original={item.price} discount={allDiscounts[item.uuid]} variant="compact" />
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Precio por persona</p>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <label htmlFor={`quantity-${item.id}`} className="text-sm font-medium text-gray-700">Pasajeros:</label>
                                <div className="flex items-center border border-gray-300 rounded-md">
                                    <button
                                        onClick={() => updateServiceQuantity(item.id, item.quantity - 1)}
                                        className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-l-md"
                                        aria-label="Disminuir cantidad de pasajeros"
                                    >-</button>
                                    <input
                                        id={`quantity-${item.id}`}
                                        type="text"
                                        value={item.quantity}
                                        readOnly
                                        className="w-10 text-center border-l border-r focus:outline-none bg-white"
                                    />
                                    <button
                                        onClick={() => updateServiceQuantity(item.id, item.quantity + 1)}
                                        className="px-3 py-1 text-lg font-semibold text-gray-600 hover:bg-gray-100 rounded-r-md"
                                        aria-label="Aumentar cantidad de pasajeros"
                                    >+</button>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveItem(item.id)}
                                type="button"
                                className="ml-4 text-sm font-medium text-red-600 hover:text-red-800 hover:underline underline-offset-4"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </li>
                ))}
            </ul>

            <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                    <p>Subtotal</p>
                    <p>S/ {subtotal.toFixed(2)}</p>
                </div>
                <p className="mt-1 text-sm text-gray-500">Los impuestos y gastos de envío se calculan en el siguiente paso.</p>
                <div className="mt-6">
                    <button
                        onClick={handleCheckout}
                        className="w-full bg-green-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        Completar Datos y Pagar
                    </button>
                </div>
                <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                    <p>
                        o{' '}
                        <a href="/servicios" className="text-naranja-c font-medium hover:text-naranja-f">
                            continuar explorando
                            <span aria-hidden="true"> &rarr;</span>
                        </a>
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
}