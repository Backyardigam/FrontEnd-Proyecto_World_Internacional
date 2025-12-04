import { useEffect, useState } from 'react';

interface PaymentButtonProps {
  formToken: string; // El token que te dio tu backend
}

export const IzipayButton = ({ formToken }: PaymentButtonProps) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verificamos que la librería de Izipay (KR) se haya cargado en el navegador
    // @ts-ignore (KR es inyectado globalmente por el script del head)
    if (window.KR) {
      
      // 1. Configuramos el Token
      // @ts-ignore
      window.KR.setFormToken(formToken)
        .then(({ KR }: { KR: any }) => {
          // 2. Opcional: Agregar Listeners para saber qué pasa
          return KR.onSubmit((event: any) => {
             // El usuario hizo click en pagar.
             // Si el formulario es válido, Izipay redirigirá automáticamente.
             return true; 
          });
        })
        .then(({ KR }: { KR: any }) => {
          // 3. Renderizamos el botón (o preparamos la redirección)
          // Esto busca el div con clase 'kr-embedded' y pone el botón ahí.
          return KR.render(); 
        })
        .then(() => {
           setIsReady(true);
           console.log("Formulario Izipay listo");
        })
        .catch((error: any) => {
           console.error("Error al cargar Izipay:", error);
        });
    }
  }, [formToken]);

  return (
    <div className="payment-container">
      {/* ESTE DIV ES MÁGICO. 
        Izipay buscará esta clase exacta y dibujará aquí el botón de "Pagar".
        Al hacer clic, redirigirá al usuario a secure.micuentaweb.pe 
      */}
      <div className="kr-embedded" kr-form-token={formToken}>
        
        {/* Puedes personalizar lo que se ve mientras carga */}
        {!isReady && <p>Cargando pasarela segura...</p>}

      </div>
    </div>
  );
};