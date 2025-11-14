import React, { useState } from "react";
import { loginUser, continueAsGuest } from "../../utils/authActions";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showGuestTerms, setShowGuestTerms] = useState(false);
  const [guestTermsAccepted, setGuestTermsAccepted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await loginUser(email, password);
      
      // SOLUCIÓN: Usamos setTimeout para empujar la redirección al final de la cola de eventos.
      // Esto da tiempo al navegador para procesar la actualización del estado y la cookie de sesión
      // antes de que la nueva página cargue y ejecute el authInitializer, evitando la condición de carrera.
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      setTimeout(() => {
        window.location.replace(redirectTo);
      }, 0);

    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    if (!showGuestTerms) {
      setShowGuestTerms(true);
      return;
    }

    // Si los términos ya se muestran y están aceptados, procede.
    setError(null);
    setIsLoading(true);
    try {
      await continueAsGuest();
      // La redirección se maneja después de una acción exitosa.
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/";
      window.location.replace(redirectTo);
    } catch (err: any) {
      setError(err.message || "No se pudo iniciar la sesión de invitado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Correo electrónico
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-naranja-c hover:bg-naranja-f focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rojo-f disabled:bg-orange-300"
          >
            {isLoading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-naranja-c">
          <a href="/reset-password" className="font-medium hover:underline underline-offset-4 hover:text-naranja-f">¿Olvidaste tu contraseña?</a>
          <a href="/register" className="font-medium hover:underline underline-offset-4 hover:text-naranja-f">Registrar usuario</a>
        </div>
      </form>

      <div className="mt-6 relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 text-gray-500">o si prefieres ...</span></div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleContinueAsGuest}
          // El botón se deshabilita si estamos cargando o si los términos se muestran pero no han sido aceptados.
          disabled={isLoading || (showGuestTerms && !guestTermsAccepted)}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar como invitado
        </button>
      </div>

      {/* El checkbox de Términos y Condiciones solo aparece después del primer clic */}
      {showGuestTerms && (
        <div className="mt-4">
          <div className="flex items-center">
            <input
              id="guest-terms"
              name="guest-terms"
              type="checkbox"
              checked={guestTermsAccepted}
              onChange={(e) => setGuestTermsAccepted(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="guest-terms" className="ml-2 block text-sm text-gray-900">
              Acepto los <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">Términos y Condiciones</a>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
