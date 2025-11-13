import React, { useState, useEffect } from 'react';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../../utils/authActions';

type Step = 'enterEmail' | 'enterCode' | 'resetPassword' | 'success';

export default function ResetPasswordForm() {
  const [currentStep, setCurrentStep] = useState<Step>('enterEmail');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (currentStep === 'enterCode' && resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown, currentStep]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setCurrentStep('enterCode');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el código. Verifica el correo e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    try {
      await requestPasswordReset(email);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "No se pudo reenviar el código. Intenta más tarde.");
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await verifyResetCode(email, code);
      setCurrentStep('resetPassword');
    } catch (err: any) {
      setError(err.message || 'El código es incorrecto o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await resetPassword(email, code, password);
      setCurrentStep('success');
    } catch (err: any) {
      setError(err.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'enterEmail':
        return (
          <form className="space-y-6" onSubmit={handleEmailSubmit}>
            <p className="text-center text-sm text-gray-600">
              Ingresa tu correo electrónico y te enviaremos un código para restablecer tu contraseña.
            </p>
            <div>
              <label htmlFor="email-address" className="sr-only">Correo electrónico</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-naranja-c hover:bg-naranja-f focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rojo-f disabled:opacity-50">
              {isLoading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        );

      case 'enterCode':
        return (
          <form className="space-y-6" onSubmit={handleCodeSubmit}>
            <p className="text-center text-sm text-gray-600">
              Hemos enviado un código a <span className="font-bold">{email}</span>. Ingrésalo a continuación.
            </p>
            <div>
              <label htmlFor="verification-code" className="sr-only">Código de Verificación</label>
              <input
                id="verification-code"
                name="code"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Código de 6 dígitos"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-naranja-c hover:bg-naranja-f focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rojo-f disabled:opacity-50">
                    {isLoading ? 'Verificando...' : 'Verificar Código'}
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
        );

      case 'resetPassword':
        return (
          <form className="space-y-6" onSubmit={handlePasswordSubmit}>
            <p className="text-center text-sm text-gray-600">
              Código verificado. Ahora puedes ingresar tu nueva contraseña.
            </p>
            <div className="flex -space-x-px">
              <div className="w-1/2">
                <label htmlFor="password" className="sr-only">Nueva Contraseña</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nueva Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="confirm-password" className="sr-only">Confirmar Contraseña</label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-r-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-naranja-c hover:bg-naranja-f focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rojo-f disabled:opacity-50">
              {isLoading ? 'Guardando...' : 'Restablecer Contraseña'}
            </button>
          </form>
        );

      case 'success':
        return (
          <div className="text-center">
            <p className="text-green-600 font-semibold">¡Tu contraseña ha sido restablecida con éxito!</p>
            <a
              href="/login"
              className="mt-4 inline-block w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Ir a Iniciar Sesión
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-8">
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {renderStep()}
    </div>
  );
}