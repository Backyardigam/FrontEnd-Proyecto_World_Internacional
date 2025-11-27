import React, { useState, useEffect } from "react";
import { apiGet, apiPatch } from "../../../utils/apiClient";
import ServiceForm from "./ServiceForm";
import ServicePreview from "./ServicePreview";
import Boton from "../admin_utils/Boton";

interface Service {
  id: string;
  id_name: string;
  name: string;
  cost: string;
  type: "tour" | "mirabus";
  serviceState: "visible" | "hidden";
}

export default function GestionPaginaView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para controlar la visibilidad y el modo del formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [previewServiceId, setPreviewServiceId] = useState<string | null>(null);

  const fetchServices = () => {
    setLoading(true);

    // --- SIMULACIÓN DE API ---
    const mockData: Service[] = [
      {
        "id": "cmi3f8s8m0002tg1i7cxkhvg6",
        "id_name": "tacna_tarata",
        "name": "Tacna Tarata",
        "cost": "200",
        "type": "tour",
        "serviceState": "visible"
      },
      {
        "id": "cmi3f8sy80003tg1isivywlbm",
        "id_name": "valle_viejo",
        "name": "Valle Viejo",
        "cost": "50",
        "type": "mirabus",
        "serviceState": "visible"
      },
      {
        "id": "cmi4po8k00000mn1iteykxz8k",
        "id_name": "tacna_testeo",
        "name": "Tacna Testeo",
        "cost": "2000",
        "type": "tour",
        "serviceState": "visible"
      }
    ];

    setTimeout(() => {
      setServices(mockData);
      setError(null);
      setLoading(false);
    }, 300); // 0.8 segundos de retraso para simular la red

    // apiGet<Service[]>("/manage/services/", { redirectPath: "/core-tacana-wits-7b345" })
    //   .then((data) => {
    //     setServices(data);
    //     setError(null);
    //   })
    //   .catch((err) => {
    //     setError("Error al cargar los servicios. Inténtalo de nuevo.");
    //     console.error(err);
    //   })
    //   .finally(() => {
    //     setLoading(false);
    //   });
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

  const handlePreview = (id: string) => {
    setPreviewServiceId(id);
  };

  const handleCloseForms = () => {
    setIsFormOpen(false);
    setPreviewServiceId(null);
    setSelectedServiceId(null);
  }

  const handleToggleState = async (service: Service) => {
    const { id, serviceState } = service;
    const newState = serviceState === 'visible' ? 'hidden' : 'visible';
    const actionText = newState === 'hidden' ? 'desactivar' : 'activar';

    // Usamos un confirm para seguridad
    if (!window.confirm(`¿Estás seguro de que quieres ${actionText} el servicio "${service.name}"?`)) {
      return;
    }

    try {
      await apiPatch(`/manage/service/${id}`, { state: newState }, { handle403: 'notify' });
      fetchServices(); // Refrescamos la lista para ver el cambio
    } catch (err) {
      console.error(`Error al ${actionText} el servicio:`, err);
    }
  };

  return (
    previewServiceId ? (
      // --- VISTA DE VISTA PREVIA ---
      <ServicePreview
        serviceId={previewServiceId}
        onClose={handleCloseForms}
      />
    ) : isFormOpen ? (
      // --- VISTA DE FORMULARIO ---
      <ServiceForm
        serviceId={selectedServiceId}
        onClose={handleCloseForms}
        onSave={fetchServices}
        // Pasamos el estado actual del servicio solo si estamos en modo edición
        initialServiceState={
          selectedServiceId ? services.find(s => s.id === selectedServiceId)?.serviceState : undefined
        }
      />
    ) : (
      // --- VISTA DE LISTA (POR DEFECTO) ---
      <div className="space-y-8">
        {/* Sección Slider (Placeholder) */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Gestión de Slider Principal
          </h2>
          <p className="text-gray-500">
            Esta sección para administrar el slider de la página de inicio estará
            disponible próximamente.
          </p>
        </div>
  
        {/* Sección Servicios */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Gestión de Servicios
            </h2>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg max-w-fit hover:bg-green-700"
            >
              Crear Servicio
            </button>
          </div>
  
          {loading && <p>Cargando servicios...</p>}
          {error && <p className="text-red-500">{error}</p>}
  
          {!loading && !error && (
            <ul className="space-y-3">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border border-gray-400 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">
                      Tipo: {service.type} - Estado:{" "}
                      <span
                        className={
                          service.serviceState === "visible"
                            ? "text-green-600"
                            : "text-gray-400"
                        }
                      >
                        {service.serviceState}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 mt-4 md:mt-0">
                    <Boton text="Vista Previa" style="bg-blue-600" onPress={() => handlePreview(service.id)} />
                    <Boton text="Editar" style="bg-yellow-600" onPress={() => handleEdit(service.id)} />
                    <Boton
                      text={service.serviceState === 'visible' ? 'Desactivar' : 'Activar'}
                      style={service.serviceState === 'visible' ? 'bg-gray-600' : 'bg-teal-600'}
                      onPress={() => handleToggleState(service)}
                    />
                    <Boton text="Eliminar" style="bg-red-600" onPress={() => ""} />
                    <Boton text="Promocion" style="bg-naranja-c" onPress={() => ""} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  );
}
