import React, { useState, useEffect, useMemo } from 'react';
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
  const [loading, setLoading] = useState(true); // Para la carga inicial
  const [isProcessing, setIsProcessing] = useState(false); // Para acciones en lote
  const [error, setError] = useState<string | null>(null);

  // Estados para la UI interactiva
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [batchFormData, setBatchFormData] = useState<PromotionFormData>({ discountAmount: 0, discountExpiration: '', discountStock: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setBatchFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) : value,
    }));
  };

  // --- Lógica de API en Lote ---

  const handleBatchApply = async () => {
    if (selectedServiceIds.size === 0) {
      setError("Por favor, selecciona al menos un servicio.");
      return;
    }
    if (!batchFormData.discountAmount || !batchFormData.discountExpiration) {
      setError("El monto de descuento y la fecha de expiración son obligatorios.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    // La lógica de aplicación ahora depende del tipo de descuento
    const promises = Array.from(selectedServiceIds).map(id => {
      const service = servicesWithPromotions.find(s => s.id === id);
      if (!service) return Promise.reject({ id, error: new Error("Servicio no encontrado") });

      let payload: Partial<PromotionFormData> = { ...batchFormData };

      // Si el descuento es por porcentaje, calculamos el monto fijo para este servicio específico
      if (discountType === 'percentage') {
        const originalCost = parseFloat(service.cost);
        const calculatedDiscount = (originalCost * batchFormData.discountAmount) / 100;
        payload.discountAmount = parseFloat(calculatedDiscount.toFixed(2)); // Redondear a 2 decimales
      }

      const method = service?.promotion ? apiPatch : apiPost;
      return method<IPromotion>(`/manage/promotion/${id}`, payload)
        .then(updatedPromotion => ({ id, promotion: updatedPromotion, status: 'fulfilled' as const }))
        .catch(err => ({ id, error: err, status: 'rejected' as const }));
    });



    const results = await Promise.all(promises);

    // Actualizar el estado local con los resultados
    setServicesWithPromotions(currentServices => {
      const updatedMap = new Map(currentServices.map(s => [s.id, s]));
      results.forEach(res => {
        if (res.status === 'fulfilled') {
          const existingService = updatedMap.get(res.id);
          if (existingService) {
            updatedMap.set(res.id, { ...existingService, promotion: res.promotion });
          }
        }
      });
      return Array.from(updatedMap.values());
    });

    const failedCount = results.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
      setError(`${failedCount} promociones no se pudieron aplicar.`);
    }

    setIsProcessing(false);
    setSelectedServiceIds(new Set()); // Deseleccionar todo
  };

  const handleBatchRemove = async () => {
    if (selectedServiceIds.size === 0) {
      setError("Por favor, selecciona al menos un servicio para quitarle la promoción.");
      return;
    }
    if (!window.confirm(`¿Seguro que quieres eliminar las promociones de ${selectedServiceIds.size} servicios?`)) return;

    setIsProcessing(true);
    setError(null);

    const promises = Array.from(selectedServiceIds).map(id =>
      apiDelete(`/manage/promotion/${id}`)
        .then(() => ({ id, status: 'fulfilled' as const }))
        .catch(err => ({ id, error: err, status: 'rejected' as const }))
    );

    const results = await Promise.all(promises);

    // Actualizar estado local
    setServicesWithPromotions(currentServices =>
      currentServices.map(s =>
        results.some(r => r.status === 'fulfilled' && r.id === s.id) ? { ...s, promotion: null } : s
      )
    );

    const failedCount = results.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
      setError(`${failedCount} promociones no se pudieron eliminar.`);
    }

    setIsProcessing(false);
    setSelectedServiceIds(new Set()); // Deseleccionar todo
  };

  // --- Helpers y Derivados ---

  const calculateDiscountPercentage = (cost: string, discount: number | undefined) => {
    const originalCost = parseFloat(cost);
    if (!discount || originalCost === 0) return 0;
    return ((discount / originalCost) * 100).toFixed(0);
  };

  const filteredServices = useMemo(() => {
    if (!searchTerm) return servicesWithPromotions;
    return servicesWithPromotions.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, servicesWithPromotions]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Promociones</h2>

      {loading && <p>Cargando promociones...</p>}

      {/* --- Panel de Acciones en Lote --- */}
      {!loading && (
        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg mb-8 space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Acciones en Lote</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-medium block text-sm">Valor del Descuento</label>
              <div className="flex items-center mt-1">
                <input type="number" name="discountAmount" value={batchFormData.discountAmount ?? ''} onChange={handleFormChange} className="w-full p-2 border rounded-l-md" />
                <div className="flex border border-l-0 rounded-r-md">
                  <button type="button" onClick={() => setDiscountType('fixed')} className={`px-3 py-2 text-sm ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    S/.
                  </button>
                  <button type="button" onClick={() => setDiscountType('percentage')} className={`px-3 py-2 text-sm rounded-r-md ${discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                    %
                  </button>
                </div>
              </div>
              {discountType === 'percentage' && (
                <p className="text-xs text-gray-500 mt-1">El descuento se calculará sobre el precio original de cada servicio.</p>
              )}
            </div>
            <div>
              <label className="font-medium block text-sm">Fecha de Expiración</label>
              <input type="date" name="discountExpiration" value={batchFormData.discountExpiration ?? ''} onChange={handleFormChange} className="w-full p-2 border rounded-md mt-1" />
            </div>
            <div>
              <label className="font-medium block text-sm">Stock (opcional)</label>
              <input type="number" name="discountStock" value={batchFormData.discountStock ?? ''} onChange={handleFormChange} placeholder="Ilimitado" className="w-full p-2 border rounded-md mt-1" />
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <Boton text={`Aplicar a ${selectedServiceIds.size} seleccionados`} style="bg-blue-600" onPress={handleBatchApply} />
            <Boton text="Quitar Promoción" style="bg-red-600" onPress={handleBatchRemove} />
            {isProcessing && <p className="text-sm text-blue-600">Procesando...</p>}
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* --- Barra de Búsqueda y Lista de Servicios --- */}
      {!loading && servicesWithPromotions.length > 0 && (
        <div>
          <input type="text" placeholder="Buscar servicio por nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mb-4" />
          <ul className="space-y-3">
            {filteredServices.map(item => (
              <li key={item.id} className="p-4 border border-gray-300 rounded-lg flex items-center gap-4 hover:bg-gray-50">
                <input type="checkbox" className="h-5 w-5 flex-shrink-0" checked={selectedServiceIds.has(item.id)} onChange={() => handleToggleSelection(item.id)} />
                
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Precio Original: S/ {item.cost}</p>
                </div>

                <div className="flex-1 bg-gray-50 p-3 rounded-md min-w-[300px]">
                  {item.promotion ? (
                    <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                      <p><span className="font-semibold">Precio Final:</span> <span className="font-bold text-green-700">S/ {(parseFloat(item.cost) - parseFloat(item.promotion.discountAmount as any)).toFixed(2)}</span></p>
                      <p><span className="font-semibold">Descuento:</span> S/ {item.promotion.discountAmount} (~{calculateDiscountPercentage(item.cost, parseFloat(item.promotion.discountAmount as any))}%)</p>
                      <p><span className="font-semibold">Expira:</span> {new Date(item.promotion.discountExpiration).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Stock:</span> {item.promotion.discountStock ?? 'Ilimitado'}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sin promoción activa</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}