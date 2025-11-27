import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/apiClient';
import type { IServiceListItem, IPromotion, IServiceWithPromotion } from '../admin_utils/promocionAdmin';
import Boton from '../admin_utils/Boton';

export default function PromocionesView() {
  const [servicesWithPromotions, setServicesWithPromotions] = useState<IServiceWithPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Obtener la lista de todos los servicios
        const services = await apiGet<IServiceListItem[]>("/manage/service/");

        // 2. Crear un array de promesas para obtener la promoción de cada servicio
        const promotionPromises = services.map(service =>
          apiGet<IPromotion>(`/manage/promotion/${service.id}`)
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

  const handleCreateOrEdit = (serviceId: string) => {
    // Lógica para abrir el modal/formulario de creación/edición
    console.log(`Abrir formulario para el servicio: ${serviceId}`);
  };

  const handleDelete = (serviceId: string) => {
    // Lógica para eliminar la promoción
    console.log(`Eliminar promoción del servicio: ${serviceId}`);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Promociones</h2>
      
      {loading && <p>Cargando promociones...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {servicesWithPromotions.map(item => (
            <div key={item.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Información del Servicio */}
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">Precio Original: S/ {item.cost}</p>
              </div>

              {/* Detalles de la Promoción */}
              <div className="flex-1 bg-gray-50 p-3 rounded-md">
                {item.promotion ? (
                  <div className="text-sm space-y-1">
                    <p><span className="font-semibold">Descuento:</span> {item.promotion.discountAmount}%</p>
                    <p><span className="font-semibold">Expira:</span> {item.promotion.discountExpiration}</p>
                    <p><span className="font-semibold">Stock:</span> {item.promotion.discountStock ?? 'Ilimitado'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sin promoción activa</p>
                )}
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-2">
                <Boton
                  text={item.promotion ? "Editar" : "Crear Promoción"}
                  style={item.promotion ? "bg-blue-600" : "bg-green-600"}
                  onPress={() => handleCreateOrEdit(item.id)}
                />
                {item.promotion && (
                  <Boton
                    text="Eliminar"
                    style="bg-red-600"
                    onPress={() => handleDelete(item.id)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}