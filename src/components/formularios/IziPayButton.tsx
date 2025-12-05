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
        // --- ¡CAMBIO CLAVE! ---
        // Reestructuramos la cadena de promesas para que cada paso devuelva el objeto KR.
        .then(({ KR: krInstance }: { KR: any }) => {
          // 2. Agregamos el listener y devolvemos la instancia para el siguiente .then()
          krInstance.onSubmit((event: any) => {
            // El usuario hizo click en pagar.
            // Si el formulario es válido, Izipay redirigirá automáticamente.
            return true;
          });
          return krInstance; // <-- Devolvemos la instancia
        })
        .then((krInstance: any) => {
          // 3. Ahora sí, llamamos a .render() sobre la instancia recibida.
          return krInstance.render();
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
      <div className="kr-smart-form" kr-form-token={formToken}>
        
        {/* Puedes personalizar lo que se ve mientras carga */}

      </div>
        {!isReady && <p>Cargando pasarela segura...</p>}
    </div>
  );
};