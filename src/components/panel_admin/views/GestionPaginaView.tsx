import React, { useState, useEffect } from "react";
import { apiGet } from "../../../utils/apiClient";
import ServiceForm from "./ServiceForm";

interface Service {
  id: string;
  id_name: string;
  name: string;
  cost: string;
  type: 'tour' | 'mirabus';
  serviceState: 'visible' | 'hidden' | 'deleted';
}

export default function GestionPaginaView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar la visibilidad y el modo del formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  const fetchServices = () => {
    setLoading(true);
    apiGet<Service[]>('/manage', { redirectPath: '/core-tacana-wits-7b345' })
      .then(data => {
        setServices(data);
        setError(null);
      })
      .catch(err => {
        setError('Error al cargar los servicios. Inténtalo de nuevo.');
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = () => {
    setSelectedServiceId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedServiceId(id);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Sección Slider (Placeholder) */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Gestión de Slider Principal</h2>
        <p className="text-gray-500">Esta sección para administrar el slider de la página de inicio estará disponible próximamente.</p>
      </div>

      {/* Sección Servicios */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Gestión de Servicios</h2>
          <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
            Crear Servicio
          </button>
        </div>

        {loading && <p>Cargando servicios...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!loading && !error && (
          <ul className="space-y-3">
            {services.map(service => (
              <li key={service.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">Tipo: {service.type} - Estado: <span className={service.serviceState === 'visible' ? 'text-green-600' : 'text-gray-400'}>{service.serviceState}</span></p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-sm text-blue-600 hover:underline">Vista Previa</button>
                  <button onClick={() => handleEdit(service.id)} className="text-sm text-yellow-600 hover:underline">Editar</button>
                  <button className="text-sm text-gray-500 hover:underline">Desactivar</button>
                  <button className="text-sm text-red-600 hover:underline">Eliminar</button>
                  <button className="text-sm text-purple-600 hover:underline">Promoción</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Formulario Modal */}
      {isFormOpen && (
        <ServiceForm 
          serviceId={selectedServiceId} 
          onClose={() => setIsFormOpen(false)}
          onSave={fetchServices} // Pasamos la función para refrescar la lista
        />
      )}
    </div>
  );
}
