import React, { useEffect, useState } from "react";
import { redirectIfAdmin } from "../../utils/authActions";
import { loginAdminUser, verifyAndLoginUser } from "../../utils/authActions";

export default function LoginAdmin() {
  const [step, setStep] = useState<"credentials" | "verifyCode">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Al cargar la página de login, verifica si ya hay una sesión de admin activa.
    // Si es así, redirige directamente al panel para no mostrar el login de nuevo.
    redirectIfAdmin();
  }, []);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      setLoading(false);
      return;
    }

    try {
      const result = await loginAdminUser(email, password);

      if (result.nextStep === "NEEDS_VERIFICATION") {
        // Si se necesita verificación, cambiamos al paso de introducir el código.
        setStep("verifyCode");
      } else {
        // Si el login fue directo (ej. rol con menos privilegios), redirigimos.
        window.location.href = "/core-tacana-wits-7b345/panel";
      }
    } catch (err: any) {
      setError(
        err.message || "Error al iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!code) {
      setError("Por favor, ingresa el código de verificación.");
      setLoading(false);
      return;
    }

    try {
      // Usamos la función existente para verificar el código y completar el login.
      await verifyAndLoginUser(email, code);
      window.location.href = "/core-tacana-wits-7b345/panel";
    } catch (err: any) {
      setError(err.message || "Código incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "credentials") {
    return (
      <form onSubmit={handleCredentialSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-lg">{error}</div>
        )}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Correo Electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50"
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCodeSubmit} className="space-y-6">
      <p className="text-sm text-gray-600">
        Se ha enviado un código de verificación a <strong>{email}</strong>. Por
        favor, ingrésalo a continuación.
      </p>
      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded-lg">{error}</div>
      )}
      <div>
        <label
          htmlFor="code"
          className="block text-sm font-medium text-gray-700"
        >
          Código de Verificación
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md disabled:opacity-50"
      >
        {loading ? "Verificando..." : "Confirmar e Ingresar"}
      </button>
    </form>
  );
}
