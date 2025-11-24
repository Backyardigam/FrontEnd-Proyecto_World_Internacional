import React from 'react';
import { useStore } from '@nanostores/react';
import { $cart } from '../../utils/cartStore';
import { useEffect, useState } from 'react';

export default function CartBubble() {
  const cart = useStore($cart);
  const [hasMounted, setHasMounted] = useState(false);

  // Este useEffect solo se ejecuta en el navegador, después del primer render.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const itemCount = cart.items.length;

  // Si el componente no se ha montado en el cliente O no hay items,
  // no mostramos la burbuja. Esto asegura que el render del servidor y
  // el primer render del cliente sean idénticos.
  if (!hasMounted || itemCount === 0) {
    return null; // O puedes retornar el icono base sin el contador
  }

  return (
    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {itemCount > 9 ? '9+' : itemCount}
    </span>
  );
}