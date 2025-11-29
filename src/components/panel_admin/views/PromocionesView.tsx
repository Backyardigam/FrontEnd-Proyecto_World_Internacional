import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../utils/apiClient';
import type { IServiceListItem, IPromotion, IServiceWithPromotion } from '../admin_utils/promocionAdmin';
import Boton from '../admin_utils/Boton';

// Estado para el formulario de edición (en línea o en lote)
interface PromotionFormData {
  discountAmount: number;
  discountExpiration: string; // formato YYYY-MM-DD
  discountStock: number | null;
}

export default function PromocionesView() {
  const [servicesWithPromotions, setServicesWithPromotions] = useState<IServiceWithPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para la UI interactiva
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PromotionFormData>>({});

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Obtener la lista de todos los servicios
        const services = await apiGet<IServiceListItem[]>("/manage/service/");

        // 2. Crear un array de promesas para obtener la promoción de cada servicio
        const promotionPromises = services.map(service =>
          apiGet<IPromotion | null>(`/manage/promotion/${service.id}`)
            .then(promotion => ({ ...service, promotion })) // Éxito: combinar servicio y promoción
            .catch(err => ({ ...service, promotion: null })) // Fracaso (ej. 404): servicio sin promoción
        );

        // 3. Ejecutar todas las promesas en paralelo
        const combinedData = await Promise.all(promotionPromises);

        setServicesWithPromotions(combinedData);

      } catch (err: any) {
        setError("Error al cargar los servicios. " + (err.message || ""));
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  // --- Lógica de Interfaz ---

  const handleToggleSelection = (serviceId: string) => {
    const newSelection = new Set(selectedServiceIds);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    setSelectedServiceIds(newSelection);
  };

  const handleStartEdit = (service: IServiceWithPromotion) => {
    setEditingServiceId(service.id);
    if (service.promotion) {
      setEditFormData({
        discountAmount: parseFloat(service.promotion.discountAmount as any),
        discountExpiration: service.promotion.discountExpiration.split('T')[0], // Formato YYYY-MM-DD
        discountStock: service.promotion.discountStock,
      });
    } else {
      // Valores por defecto para una nueva promoción
      setEditFormData({ discountAmount: 0, discountExpiration: '', discountStock: null });
    }
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
    setEditFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };

  // --- Lógica de API ---

  const handleSave = async (serviceId: string) => {
    const service = servicesWithPromotions.find(s => s.id === serviceId);
    if (!service) return;

    const method = service.promotion ? apiPatch : apiPost;
    try {
      const updatedPromotion = await method<IPromotion>(`/manage/promotion/${serviceId}`, editFormData);
      // Actualizar la UI
      setServicesWithPromotions(prev =>
        prev.map(s => s.id === serviceId ? { ...s, promotion: updatedPromotion } : s)
      );
      handleCancelEdit();
    } catch (err: any) {
      setError(`Error al guardar: ${err.message}`);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta promoción?")) return;
    try {
      await apiDelete(`/manage/promotion/${serviceId}`);
      // Actualizar la UI
      setServicesWithPromotions(prev =>
        prev.map(s => s.id === serviceId ? { ...s, promotion: null } : s)
      );
    } catch (err: any) {
      setError(`Error al eliminar: ${err.message}`);
    }
  };

  // --- Helper para calcular porcentaje ---
  const calculateDiscountPercentage = (cost: string, discount: number | undefined) => {
    const originalCost = parseFloat(cost);
    if (!discount || originalCost === 0) return 0;
    return ((discount / originalCost) * 100).toFixed(0);
  };

  // --- Componente de Formulario de Edición en Línea ---
  const InlineEditForm = ({ service }: { service: IServiceWithPromotion }) => (
    <div className="flex-1 bg-blue-50 p-3 rounded-md border border-blue-300 space-y-2">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <label className="font-semibold block">Descuento (S/.)</label>
          <input type="number" name="discountAmount" value={editFormData.discountAmount ?? ''} onChange={handleFormChange} className="w-full p-1 border rounded" />
        </div>
        <div>
          <label className="font-semibold block">Precio Final (S/.)</label>
          <p className="p-1 font-bold text-blue-700">{(parseFloat(service.cost) - (editFormData.discountAmount || 0)).toFixed(2)}</p>
        </div>
        <div>
          <label className="font-semibold block">Expira</label>
          <input type="date" name="discountExpiration" value={editFormData.discountExpiration ?? ''} onChange={handleFormChange} className="w-full p-1 border rounded" />
        </div>
        <div>
          <label className="font-semibold block">Stock</label>
          <input type="number" name="discountStock" value={editFormData.discountStock ?? ''} onChange={handleFormChange} placeholder="Ilimitado" className="w-full p-1 border rounded" />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Boton text="Cancelar" style="bg-gray-500" onPress={handleCancelEdit} />
        <Boton text="Guardar" style="bg-blue-600" onPress={() => handleSave(service.id)} />
      </div>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Promociones</h2>
      
      {loading && <p>Cargando promociones...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ul className="space-y-4">
          {servicesWithPromotions.map(item => (
            <li key={item.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Checkbox y Info Servicio */}
              <div className="flex items-start gap-4 flex-1">
                <input type="checkbox" className="mt-2 h-5 w-5" checked={selectedServiceIds.has(item.id)} onChange={() => handleToggleSelection(item.id)} />
                <div>
                  <p className="font-bold text-lg text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Precio Original: S/ {item.cost}</p>
                </div>
              </div>

              {/* Detalles de la Promoción o Formulario de Edición */}
              {editingServiceId === item.id ? (
                <InlineEditForm service={item} />
              ) : (
                <div className="flex-1 bg-gray-50 p-3 rounded-md">
                  {item.promotion ? (
                    <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                      <p><span className="font-semibold">Precio Final:</span> <span className="font-bold text-green-700">S/ {(parseFloat(item.cost) - parseFloat(item.promotion.discountAmount as any)).toFixed(2)}</span></p>
                      <p><span className="font-semibold">Descuento:</span> S/ {item.promotion.discountAmount} (~{calculateDiscountPercentage(item.cost, parseFloat(item.promotion.discountAmount))}%)</p>
                      <p><span className="font-semibold">Expira:</span> {new Date(item.promotion.discountExpiration).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Stock:</span> {item.promotion.discountStock ?? 'Ilimitado'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin promoción activa</p>
                  )}
                </div>
              )}

              {/* Botones de Acción (si no se está editando) */}
              {editingServiceId !== item.id && (
                <div className="flex gap-2">
                  <Boton
                    text={item.promotion ? "Editar" : "Crear"}
                    style={item.promotion ? "bg-yellow-600" : "bg-green-600"}
                    onPress={() => handleStartEdit(item)}
                  />
                  {item.promotion && (
                    <Boton
                      text="Eliminar"
                      style="bg-red-600"
                      onPress={() => handleDelete(item.id)}
                    />
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}