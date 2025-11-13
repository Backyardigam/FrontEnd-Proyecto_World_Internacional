import React, { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $auth } from "../../utils/authStore";
import { updateUserProfile } from "../../utils/authActions";

export default function UserProfile() {
  const { user, loading } = useStore($auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phoneNumber: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza el formulario con los datos del usuario cuando entra en modo edición
  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || "", phoneNumber: user.phoneNumber || "" });
    }
  }, [user, isEditing]);

  // Esqueleto de carga
  if (loading || !user) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 rounded w-48"></div>
              <div className="h-4 bg-gray-300 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await updateUserProfile({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
      });
      setIsEditing(false); // Salir del modo edición al guardar con éxito
    } catch (err: any) {
      setError(err.message || "No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const hasChanges = user.name !== formData.name || user.phoneNumber !== formData.phoneNumber;

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Sección de Datos del Usuario */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden self-center mb-4 sm:mb-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar del usuario"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-naranja-c text-white flex items-center justify-center text-4xl font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Información */}
              <div className="text-center sm:text-left">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="text-2xl font-bold text-gray-800 border-b-2 border-gray-300 focus:border-blue-500 outline-none"
                    />
                    <p className="text-md text-gray-600">{user.email} (no se puede cambiar)</p>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="text-sm text-gray-500 border-b-2 border-gray-300 focus:border-blue-500 outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                    <p className="text-md text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">{user.phoneNumber || "Sin número de teléfono"}</p>
                  </>
                )}
              </div>
            </div>
            {error && <div className="mt-4 p-2 text-red-700 bg-red-100 rounded-lg text-center">{error}</div>}
            {/* Botones de acción */}
            <div className="mt-6 text-right space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Editar Datos
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Historial de Boletos */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Historial de Boletos
            </h2>
            {/* Placeholder para el historial */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">
                Aquí se mostrará tu historial de boletos comprados.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                (Funcionalidad en desarrollo)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}