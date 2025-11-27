import React, { useState, useEffect } from "react";
import { apiGet, apiPostFormData } from "../../../utils/apiClient";
import type { IServiceRequest, ServiceGet } from "../admin_utils/servicioAdmin";
import TagPanel from "../admin_utils/TagPanel";
import service from "@astrojs/vercel/build-image-service";

// patch {
//   state: "visible" | "hidden";
// }

interface ServiceFormProps {
  serviceId: string | null; // null para 'Crear', un ID para 'Editar'
  onClose: () => void; // Función para cerrar el formulario
  onSave: () => void; // Función para refrescar la lista después de guardar
  initialServiceState?: 'visible' | 'hidden'; // Estado actual del servicio en modo edición
}

export default function ServiceForm({
  serviceId,
  onClose,
  onSave,
  initialServiceState
}: ServiceFormProps) {
  const [formData, setFormData] = useState<Partial<IServiceRequest>>({});
  const [files, setFiles] = useState<Record<string, File | File[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = serviceId !== null;

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);

      //API que trae los datos
      // apiGet(`/manage/service/${serviceId}`, {
      //   redirectPath: "/core-tacana-wits-7b345",
      // })
      //   .then((data) => {
      //     setFormData(data);
      //     setLoading(false);
      //   })
      //   .catch((err) => {
      //     setError("Error al cargar los datos del servicio.");
      //     setLoading(false);
      //   });

      // --- SIMULACIÓN DE API GET /manage/service/{id} ---
      const mockServiceGet: ServiceGet = {
        service: {
          id: "cmi3f8s8m0002tg1i7cxkhvg6",
          id_name: "tacna_tarata",
          name: "Tacna Tarata",
          cost: 200,
          type: "tour",
          tag: ["Aventura", "Paisaje", "Full Day"],
          fullDescription: "Una descripción completa y detallada del tour a Tarata.",
          itinerary: ["Salida de Tacna", "Visita a los petroglifos", "Almuerzo en Tarata", "Retorno a Tacna"],
          recomendations: ["Llevar bloqueador solar", "Usar sombrero", "Calzado cómodo"],
          additional: ["Incluye guía turístico", "No incluye bebidas"],
          schedule: { "Lunes a Domingo": { startTrip: "08:00", endTrip: "17:00" } },
          mediaFiles: {
            urlBg1: "https://ik.imagekit.io/world/bg1_tarata.jpg",
            urlBg2: "https://ik.imagekit.io/world/bg2_tarata.jpg",
            urlGalery: [
              "https://ik.imagekit.io/world/gal1_tarata.jpg",
              "https://ik.imagekit.io/world/gal2_tarata.jpg",
            ],
            urlTrip: "https://ik.imagekit.io/world/trip_tarata.jpg",
          },
        },
        card: {
          compactDescription: "Descubre la histórica ciudad de Tarata en un tour de día completo.",
          mediaFiles: ["https://ik.imagekit.io/world/card_tarata.jpg"],
        },
      };

      setTimeout(() => {
        // Transformar los datos de la API al formato del formulario (IServiceRequest)
        const { service, card } = mockServiceGet;
        const transformedData: Partial<IServiceRequest> = {
          name: service.name,
          cost: service.cost,
          type: service.type,
          serviceState: initialServiceState || 'visible', // Usamos el estado pasado por props
          tag: service.tag.join(';'), // Array a string
          compactDescription: card.compactDescription,
          fullDescription: service.fullDescription,
          itinerary: service.itinerary.join('\n'), // Array a string con saltos de línea
          recomendations: service.recomendations.join('\n'),
          additional: service.additional.join('\n'),
          schedule: Object.entries(service.schedule).map(([_, value]) => ({
            startTrip: value.startTrip,
            endTrip: value.endTrip,
          })),
          // El campo mediaFiles para borrar se manejará por separado
        };
        setFormData(transformedData);
        // Aquí también guardaríamos las URLs existentes para mostrarlas
        // setExistingImages(service.mediaFiles);
        setLoading(false);
      }, 800);

      // apiGet<ServiceGet>(`/manage/service/${serviceId}`, { redirectPath: "/core-tacana-wits-7b345" })
      //   .then((data) => {
      //     // Lógica de transformación aquí
      //     setFormData(transformedData);
      //     setLoading(false);
      //   })
      //   .catch((err) => {
      //     setError("Error al cargar los datos del servicio.");
      //     setLoading(false);
      //   });
    } else {
      // Resetea el formulario para el modo 'Crear'
      setFormData({
        name: "",
        cost: 0,
        type: "tour",
        serviceState: "visible",
        tag: "",
        compactDescription: "",
        fullDescription: "",
        itinerary: "",
        recomendations: "",
        additional: "",
        schedule: [{ startTrip: "09:00", endTrip: "18:00" }],
      });
    }
  }, [serviceId, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Pre-procesar datos antes de enviar
    const dataToSend = {
      ...formData,
      // Asegurarse que los campos de texto multilínea se envíen como strings separados por ';'
      itinerary: formData.itinerary?.split('\n').join(';'),
      recomendations: formData.recomendations?.split('\n').join(';'),
      additional: formData.additional?.split('\n').join(';'),
    };

    const url = isEditMode ? `/manage/service/${serviceId}` : "/manage/service";
    const method = isEditMode ? "PUT" : "POST";

    try {
      await apiPostFormData(url, dataToSend, files, {
        method,
        redirectPath: "/core-tacana-wits-7b345",
      });
      onSave(); // Llama a la función para refrescar la lista
      onClose(); // Cierra el formulario
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <p>Cargando formulario...</p>;

  return (
    // Se eliminan los estilos de modal y se reemplazan por estilos de una vista normal
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? "Editar Servicio" : "Crear Nuevo Servicio"}
      </h2>

      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- SECCIÓN: PÁGINA DEL SERVICIO --- */}
        <div className="p-6 border border-gray-200 rounded-lg space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">Detalles de la Página del Servicio</h3>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
            <input type="text" id="name" name="name" value={formData.name || ""} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Costo (S/.)</label>
              <input type="number" id="cost" name="cost" value={formData.cost || 0} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipo de Servicio</label>
              <select id="type" name="type" value={formData.type || 'tour'} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                <option value="tour">Tour</option>
                <option value="mirabus">Mirabus</option>
              </select>
            </div>
            {!isEditMode && (
              <div>
                <label htmlFor="serviceState" className="block text-sm font-medium text-gray-700">Estado Inicial</label>
                <select id="serviceState" name="serviceState" value={formData.serviceState || 'visible'} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
                  <option value="visible">Visible</option>
                  <option value="hidden">Oculto</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <TagPanel 
              selectedTagsString={formData.tag || ''}
              onChange={(newTags) => {
                setFormData(prev => ({ ...prev, tag: newTags }));
              }}
            />
          </div>

          <div>
            <label htmlFor="fullDescription" className="block text-sm font-medium text-gray-700">Descripción Completa</label>
            <textarea id="fullDescription" name="fullDescription" value={formData.fullDescription || ''} onChange={handleChange} rows={4} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label htmlFor="itinerary" className="block text-sm font-medium text-gray-700">Itinerario (un item por línea)</label>
            <textarea id="itinerary" name="itinerary" value={formData.itinerary || ''} onChange={handleChange} rows={4} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label htmlFor="recomendations" className="block text-sm font-medium text-gray-700">Recomendaciones (una por línea)</label>
            <textarea id="recomendations" name="recomendations" value={formData.recomendations || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
          </div>

          <div>
            <label htmlFor="additional" className="block text-sm font-medium text-gray-700">Información Adicional (una por línea)</label>
            <textarea id="additional" name="additional" value={formData.additional || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
          </div>

          <div>
            <h4 className="font-medium text-gray-700 pt-2">Imágenes de la Página</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="background" className="block text-sm font-medium text-gray-700">Imágenes de Fondo (Bg1, Bg2)</label>
                <input type="file" id="background" name="background" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div>
                <label htmlFor="galery" className="block text-sm font-medium text-gray-700">Imágenes de Galería</label>
                <input type="file" id="galery" name="galery" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div>
                <label htmlFor="routes" className="block text-sm font-medium text-gray-700">Imagen de Ruta/Viaje</label>
                <input type="file" id="routes" name="routes" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
            </div>
          </div>
        </div>

        {/* --- SECCIÓN: TARJETA DEL SERVICIO --- */}
        <div className="p-6 border border-gray-200 rounded-lg space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">Detalles de la Tarjeta del Servicio</h3>
          
          <div>
            <label htmlFor="compactDescription" className="block text-sm font-medium text-gray-700">Descripción Corta (para la tarjeta)</label>
            <textarea id="compactDescription" name="compactDescription" value={formData.compactDescription || ''} onChange={handleChange} rows={2} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
          </div>

          <div>
            <h4 className="font-medium text-gray-700">Imagen de la Tarjeta</h4>
            <div className="mt-2">
              <label htmlFor="card" className="block text-sm font-medium text-gray-700">Imagen de Tarjeta</label>
              <input type="file" id="card" name="card" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
            </div>
          </div>
        </div>

        <div className="border-t pt-6 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            &larr; Volver a la lista
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Servicio"}
          </button>
        </div>
      </form>
    </div>
  );
}