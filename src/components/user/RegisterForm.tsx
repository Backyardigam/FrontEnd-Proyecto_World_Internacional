import React, { useState, useEffect } from "react";
import { registerUser, verifyAndLoginUser, resendVerificationCode } from "../../utils/authActions";

export default function RegisterForm() {
  // Estado para controlar el paso actual del formulario
  const [currentStep, setCurrentStep] = useState<"register" | "verify">(
    "register"
  );

  // Estados para el formulario de registro
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estado para el formulario de verificación
  const [verificationCode, setVerificationCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Efecto para manejar el temporizador de reenvío de código
  useEffect(() => {
    if (currentStep === 'verify' && resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown, currentStep]);

  const handleRegisterSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    try {
      await registerUser({ fullName, phoneNumber, email, password });
      // Si el registro es exitoso, cambiamos al paso de verificación
      setCurrentStep("verify");
      setResendCooldown(60); // Iniciar temporizador de 60 segundos
    } catch (err: any) {
      setError(err.message || "Ocurrió un error durante el registro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await verifyAndLoginUser(email, verificationCode);
      // Si la verificación es exitosa, redirigimos al perfil o a la página principal.
      window.location.href = "/"; // O '/'
    } catch (err: any) {
      setError(
        err.message || "El código de verificación es incorrecto o ha expirado."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    // Usamos un estado de carga temporal para no bloquear el input principal
    setError(null);
    try {
      // Llamamos a la nueva acción específica para reenviar el código.
      await resendVerificationCode(email, 'register');
      setResendCooldown(60); // Reiniciar el temporizador
    } catch (err: any) {
      setError(err.message || "No se pudo reenviar el código. Intenta más tarde.");
    }
  };

  if (currentStep === "verify") {
    return (
      <div className="mt-8">
        <div className="text-center text-gray-600 mb-4">
          <p>Se ha enviado un código de verificación a:</p>
          <p className="font-semibold">{email}</p>
          <p>
            Ingrese el codigo de 6 digitos que le llego a su correo a
            continuacion
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleVerifySubmit}>
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="verification-code" className="sr-only">
              Código de Verificación
            </label>
            <input
              id="verification-code"
              name="verificationCode"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Código de Verificación"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verificando..." : "Verificar y Continuar"}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading || resendCooldown > 0}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : "Reenviar código"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Renderizado del paso de registro (Paso 1)
  return (
    <form className="mt-8 space-y-6" onSubmit={handleRegisterSubmit}>
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="rounded-md shadow-sm -space-y-px">
        {/* Nombre completo */}
        <div>
          <label htmlFor="full-name" className="sr-only">
            Nombre completo
          </label>
          <input
            id="full-name"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Celular */}
        <div>
          <label htmlFor="phone-number" className="sr-only">
            Número de celular
          </label>
          <input
            id="phone-number"
            name="phoneNumber"
            type="tel"
            autoComplete="tel"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Número de celular"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Correo electrónico */}
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
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {/* Contraseña y Repetir Contraseña en la misma fila */}
        <div className="flex -space-x-px">
          <div className="w-1/2">
            <label htmlFor="password" className="sr-only">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-bl-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="w-1/2">
            <label htmlFor="confirm-password" className="sr-only">
              Repetir Contraseña
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-br-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Repetir Contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Términos y Condiciones */}
      <div className="flex items-center">
        <input
          id="terms-and-conditions"
          name="terms-and-conditions"
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label
          htmlFor="terms-and-conditions"
          className="ml-2 block text-sm text-gray-900"
        >
          He leído y acepto los{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Términos y Condiciones
          </a>{" "}
          y la{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Política de Privacidad
          </a>
          .
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading || !termsAccepted}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Registrando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
