import React, { useState, useEffect, useCallback } from "react";
import Boton from "../admin_utils/Boton";
import * as sc from "../contracts/sellerContracts";
import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
} from "../../../utils/apiClient";

export default function SellersView() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sellers, setSellers] = useState<sc.getSellerResponse[]>([]);

  // Estados para el Modal de Crear/Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeller, setEditingSeller] =
    useState<sc.getSellerResponse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phoneNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<sc.getSellerResponse[]>("/users/sellers");
      setSellers(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los vendedores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  const openModal = (seller?: sc.getSellerResponse) => {
    setFormError(null);
    if (seller) {
      setEditingSeller(seller);
      setFormData({
        name: seller.name,
        dni: seller.dni || "",
        phoneNumber: seller.phoneNumber || "",
      });
    } else {
      setEditingSeller(null);
      setFormData({ name: "", dni: "", phoneNumber: "" });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSeller(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingSeller) {
        const payload: sc.UpdateSellerRequest = {
          name: formData.name,
          dni: formData.dni || undefined,
          phoneNumber: formData.phoneNumber || undefined,
        };
        await apiPut(`/users/sellers/${editingSeller.code}`, payload);
      } else {
        const payload: sc.CreateSellerRequest = {
          name: formData.name,
          dni: formData.dni || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          active: true,
        };
        await apiPost(`/users/sellers`, payload);
      }
      await fetchSellers();
      closeModal();
    } catch (err: any) {
      setFormError(
        err.message || "Ocurrió un error al guardar el vendedor.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (seller: sc.getSellerResponse) => {
    const action = seller.active ? "deactive" : "active";
    if (
      !window.confirm(
        `¿Seguro que quieres ${seller.active ? "desactivar" : "activar"} al vendedor ${seller.name}?`,
      )
    )
      return;
    try {
      await apiPatch(`/users/sellers/${seller.code}/${action}`, {});
      fetchSellers();
    } catch (err: any) {
      alert(err.message || "Error al cambiar el estado.");
    }
  };

  const handleDelete = async (seller: sc.getSellerResponse) => {
    if (
      !window.confirm(
        `¿Seguro que quieres eliminar al vendedor ${seller.name}? Esta acción es irreversible.`,
      )
    )
      return;
    try {
      await apiDelete(`/users/sellers/${seller.code}`);
      fetchSellers();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el vendedor.");
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Gestión de Vendedores
        </h2>
        <Boton
          text="Crear Vendedor"
          styleClass="bg-blue-600"
          onPress={() => openModal()}
        />
      </div>

      {loading && <p>Cargando datos...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Código
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre Completo
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  DNI
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Teléfono
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500"
                  >
                    No hay vendedores registrados.
                  </td>
                </tr>
              ) : (
                sellers.map((seller) => (
                  <tr key={seller.code}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {seller.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {seller.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {seller.dni || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {seller.phoneNumber || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${seller.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {seller.active
                          ? "Activo"
                          : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Boton
                          text="Editar"
                          styleClass="bg-yellow-500 text-white"
                          onPress={() =>
                            openModal(seller)
                          }
                        />
                        <Boton
                          text={
                            seller.active
                              ? "Desactivar"
                              : "Activar"
                          }
                          styleClass={
                            seller.active
                              ? "bg-gray-500 text-white"
                              : "bg-teal-500 text-white"
                          }
                          onPress={() =>
                            handleToggleStatus(
                              seller,
                            )
                          }
                        />
                        <Boton
                          text="Eliminar"
                          styleClass="bg-red-600 text-white"
                          onPress={() =>
                            handleDelete(seller)
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingSeller
                ? "Editar Vendedor"
                : "Crear Vendedor"}
            </h3>
            {formError && (
              <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">
                {formError}
              </p>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  DNI (Opcional)
                </label>
                <input
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleFormChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
