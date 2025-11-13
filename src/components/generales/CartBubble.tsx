import React from 'react';
import { useStore } from '@nanostores/react';
import { $cart } from '../../utils/cartStore';

export default function CartBubble() {
  const { items } = useStore($cart);
  const itemCount = items.length;

  if (itemCount === 0) {
    return null; // No renderizar nada si el carrito está vacío
  }

  return (
    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {itemCount > 9 ? '9+' : itemCount}
    </span>
  );
}