import React, { useState, useEffect } from "react";
import { apiGet, apiPostFormData , ApiError } from "../../../utils/apiClient";
import type { IServiceRequest, ServiceGet, IMediaUrl } from "../admin_utils/servicioAdmin";
import TagPanel from "../admin_utils/TagPanel";
import ImageManager from "../admin_utils/ImageManager";

// patch {
//   state: "visible" | "hidden";
// }

interface ServiceFormProps {
  serviceId: string | null; // null para 'Crear', un ID para 'Editar'
  onClose: () => void; // Función para cerrar el formulario
  onSave: () => void; // Función para refrescar la lista después de guardar
  initialServiceState?: 'visible' | 'hidden'; // Estado actual del servicio en modo edición
}

interface FormError {
  source: 'general' | 'background' | 'galery' | 'routes' | 'card';
  message: string;
}

export default function   ServiceForm({
  serviceId,
  onClose,
  onSave,
  initialServiceState
}: ServiceFormProps) {
  const [formData, setFormData] = useState<Partial<IServiceRequest>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [existingImages, setExistingImages] = useState<ServiceGet['service']['mediaFiles'] | null>(null);
  const [existingCardImages, setExistingCardImages] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);  const [error, setError] = useState<FormError | null>(null);
  const isEditMode = serviceId !== null;

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);

      
      // // --- SIMULACIÓN DE API GET /manage/service/{id} ---
      // const mockServiceGet: ServiceGet = {
      //   service: {
      //     id: "cmi3f8s8m0002tg1i7cxkhvg6",
      //     id_name: "tacna_tarata",
      //     name: "Tacna Tarata",
      //     cost: 200,
      //     type: "tour",
      //     tag: ["Aventura", "Paisaje"],
      //     fullDescription: "Una descripción completa y detallada del tour a Tarata.",
      //     itinerary: ["Salida de Tacna", "Visita a los petroglifos", "Almuerzo en Tarata", "Retorno a Tacna"],
      //     recomendations: ["Llevar bloqueador solar", "Usar sombrero", "Calzado cómodo"],
      //     additional: ["Incluye guía turístico", "No incluye bebidas"],
      //     schedule: { "Lunes a Domingo": { startTrip: "08:00", endTrip: "17:00" } },
      //     mediaFiles: {
      //       urlBg1: "https://ik.imagekit.io/world/bg1_tarata.jpg",
      //       urlBg2: "https://ik.imagekit.io/world/bg2_tarata.jpg",
      //       // urlBg1: "",
      //       // urlBg2: "",
      //       urlGalery: [
      //         "https://ik.imagekit.io/world/gal1_tarata.jpg",
      //         "https://ik.imagekit.io/world/gal2_tarata.jpg",
      //       ],
      //       urlTrip: "https://ik.imagekit.io/world/trip_tarata.jpg",
      //     },
      //   },
      //   card: {
      //     compactDescription: "Descubre la histórica ciudad de Tarata en un tour de día completo.",
      //     mediaFiles: ["https://ik.imagekit.io/world/card_tarata.jpg"],
      //   },
      // };

      // setTimeout(() => {
      //   // Transformar los datos de la API al formato del formulario (IServiceRequest)
      //   const { service, card } = mockServiceGet;
      //   const transformedData: Partial<IServiceRequest> = {
      //     name: service.name,
      //     cost: service.cost,
      //     type: service.type,
      //     serviceState: initialServiceState || 'visible', // Usamos el estado pasado por props
      //     tag: service.tag.join(';'), // Array a string
      //     compactDescription: card.compactDescription,
      //     fullDescription: service.fullDescription,
      //     itinerary: service.itinerary.join('\n'), // Array a string con saltos de línea
      //     recomendations: service.recomendations.join('\n'),
      //     additional: service.additional.join('\n'),
      //     schedule: Object.entries(service.schedule).map(([_, value]) => ({
      //       startTrip: value.startTrip,
      //       endTrip: value.endTrip,
      //     })),
      //     // El campo mediaFiles para borrar se manejará por separado
      //   };
      //   setFormData(transformedData);
      //   // Guardamos las URLs existentes para mostrarlas en la UI
      //   setExistingImages(service.mediaFiles ?? null); // Si mediaFiles es undefined, usamos null
      //   setExistingCardImages(card.mediaFiles ?? []); // Si mediaFiles es undefined, usamos un array vacío
      //   setLoading(false);
      // }, 800);

      apiGet<ServiceGet>(`/manage/service/${serviceId}`, { redirectPath: "/core-tacana-wits-7b345" })
        .then((data) => {
          // Transformar los datos de la API al formato del formulario (IServiceRequest)
          const { service, card } = data;
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
          // Guardamos las URLs existentes para mostrarlas en la UI
          setExistingImages(service.mediaFiles ?? null);
          setExistingCardImages(card.mediaFiles ?? []);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.status === 403) {
            setError({ source: 'general', message: "No tienes permisos para editar este servicio." });
            return; // Detenemos la carga para no mostrar un formulario vacío y roto.
          }
          setError({ source: 'general', message: "Error al cargar los datos del servicio." });
        })
        .finally(() => {
          setLoading(false);
        });
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
      setExistingImages(null);
      setExistingCardImages([]);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files: selectedFiles } = e.target;
    if (!selectedFiles || selectedFiles.length === 0) {
      e.target.value = ''; // Limpiar por si el usuario cancela la selección
      return;
    }

    setError(null); // Limpiar errores previos

    const fileLimits: Record<string, number> = {
      background: 2,
      routes: 1,
      card: 1,
    };

    const limit = fileLimits[name];
    const newFilesArray = Array.from(selectedFiles);

    // --- NUEVA LÓGICA DE VALIDACIÓN ---
    // Si no hay límite (ej. galería), simplemente añade los archivos.
    if (!limit) {
      setFiles(prev => ({ ...prev, [name]: [...(prev[name] || []), ...newFilesArray] }));
      e.target.value = '';
      return;
    }

    // --- LÓGICA DE CONTEO SIMPLIFICADA Y CORREGIDA ---
    const totalCurrentImageCount = getActiveImageCount(name as any);

    // Si el lote nuevo supera el espacio disponible, rechaza el lote completo.
    if (limit && (totalCurrentImageCount + newFilesArray.length) > limit) {
      setError({ source: name as any, message: `Límite de ${limit} archivo(s) excedido. Tienes ${totalCurrentImageCount} y trataste de añadir ${newFilesArray.length}.` });
      e.target.value = ''; // Rechaza la selección
      return;
    }

    // Si la validación pasa, añade los archivos.
    setFiles(prev => ({ ...prev, [name]: [...(prev[name] || []), ...newFilesArray] }));

    // Reseteamos el valor del input para que el usuario pueda seleccionar el mismo archivo de nuevo si lo borra.
    e.target.value = '';
  };

  const handleRemoveNewFile = (inputName: string, fileToRemove: File) => {
    setFiles(prev => {
      const updatedFiles = (prev[inputName] || []).filter(
        file => file.name !== fileToRemove.name || file.lastModified !== fileToRemove.lastModified
      );
      return { ...prev, [inputName]: updatedFiles };
    });
  };

  const handleToggleDeleteUrl = (url: string) => {
    const isRestoring = imagesToDelete.includes(url);

    if (isRestoring) {
      // --- LÓGICA DE VALIDACIÓN ANTES DE RESTAURAR ---
      const fileLimits: Record<string, number> = { background: 2, routes: 1, card: 1 };
      let targetInputName: string | undefined;

      // Encontrar a qué sección pertenece la URL que se está restaurando
      if (existingCardImages.includes(url)) targetInputName = 'card';
      else if ([...getExistingUrlsFor('urlBg1'), ...getExistingUrlsFor('urlBg2')].includes(url)) targetInputName = 'background';
      else if (getExistingUrlsFor('urlTrip').includes(url)) targetInputName = 'routes';
      // 'galery' no tiene límite, así que no necesita validación aquí.

      if (targetInputName) {
        const limit = fileLimits[targetInputName];
        const currentCount = getActiveImageCount(targetInputName as any);
        // Si el conteo actual ya está en el límite, no se puede restaurar.
        if (limit && currentCount >= limit) {
          setError({ source: targetInputName as any, message: `No se puede restaurar. El límite de ${limit} archivo(s) para esta sección ya está alcanzado.` });
          return; // Detenemos la acción.
        }
      }
    }

    setError(null); // Limpiamos cualquier error previo.
    setImagesToDelete(prev => 
      isRestoring ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  // Helper para obtener las URLs existentes de una sección
  const getExistingUrlsFor = (section: keyof NonNullable<ServiceGet['service']['mediaFiles']>): string[] => {
    if (!existingImages || !existingImages[section]) return [];    
    const urlsOrString = existingImages[section];
    // Devuelve TODAS las URLs, sin filtrar. El filtrado se hace donde se necesita.
    return Array.isArray(urlsOrString) ? urlsOrString.filter(Boolean) : (urlsOrString ? [urlsOrString] : []);
  };

  // --- NUEVA FUNCIÓN CENTRALIZADA DE CONTEO ---
  const getActiveImageCount = (inputName: 'background' | 'routes' | 'card' | 'galery'): number => {
    let existingUrls: string[] = [];
    if (inputName === 'background') {
      existingUrls = [...getExistingUrlsFor('urlBg1'), ...getExistingUrlsFor('urlBg2')];
    } else if (inputName === 'card') {
      existingUrls = existingCardImages;
    } else if (inputName === 'routes') {
      existingUrls = getExistingUrlsFor('urlTrip');
    }

    const activeExistingCount = existingUrls.filter(url => !imagesToDelete.includes(url)).length;
    const newFilesCount = (files[inputName] || []).length;

    return activeExistingCount + newFilesCount;
  }

  // Helper para calcular si un input de archivo debe estar deshabilitado
  const isFileLimitReached = (inputName: 'background' | 'routes' | 'card' | 'galery'): boolean => {
    const fileLimits: Record<string, number> = {
      background: 2,
      routes: 1,
      card: 1,
    };    const limit = fileLimits[inputName];
    if (!limit) return false;
    return getActiveImageCount(inputName) >= limit;
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
      // Añadir las URLs marcadas para eliminación
      mediaFiles: imagesToDelete.map(url => ({ url })) as IMediaUrl[],
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
      if (err instanceof ApiError && err.status === 403) {
        setError({ source: 'general', message: `No tienes permisos para ${isEditMode ? 'actualizar' : 'crear'} servicios.` });
        return;
      }
      setError({ source: 'general', message: err.message || "Ocurrió un error al guardar el servicio." });
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

      {error && error.source === 'general' && (
        <div className="p-3 text-red-700 bg-red-100 rounded-lg mb-4">
          {error.message}
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
            <div className="space-y-6 mt-2">
              <ImageManager
                title="Imágenes de Fondo (Bg1, Bg2)"
                inputName="background"
                isMultiple={true}
                isDisabled={isFileLimitReached('background')}
                errorMessage={error?.source === 'background' ? error.message : null}
                existingUrls={[...getExistingUrlsFor('urlBg1'), ...getExistingUrlsFor('urlBg2')]}
                newFiles={files['background'] || []}
                urlsToDelete={imagesToDelete}
                onFileChange={handleFileChange}
                onRemoveNewUrl={(file) => handleRemoveNewFile('background', file)}
                onToggleDeleteUrl={handleToggleDeleteUrl}
              />
              <ImageManager
                title="Imágenes de Galería"
                inputName="galery"
                isMultiple={true}
                isDisabled={isFileLimitReached('galery')} // Siempre será false, pero es más consistente
                errorMessage={error?.source === 'galery' ? error.message : null}
                existingUrls={getExistingUrlsFor('urlGalery')}
                newFiles={files['galery'] || []}
                urlsToDelete={imagesToDelete}
                onFileChange={handleFileChange}
                onRemoveNewUrl={(file) => handleRemoveNewFile('galery', file)}
                onToggleDeleteUrl={handleToggleDeleteUrl}
              />
              <ImageManager
                title="Imagen de Ruta/Viaje"
                inputName="routes"
                isMultiple={false}
                isDisabled={isFileLimitReached('routes')}
                errorMessage={error?.source === 'routes' ? error.message : null}
                existingUrls={getExistingUrlsFor('urlTrip')}
                newFiles={files['routes'] || []}
                urlsToDelete={imagesToDelete}
                onFileChange={handleFileChange}
                onRemoveNewUrl={(file) => handleRemoveNewFile('routes', file)}
                onToggleDeleteUrl={handleToggleDeleteUrl}
              />
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
            <div className="space-y-6 mt-2">
              <ImageManager
                title="Imagen de Tarjeta"
                inputName="card"
                isMultiple={false}
                isDisabled={isFileLimitReached('card')}
                errorMessage={error?.source === 'card' ? error.message : null}
                existingUrls={existingCardImages}
                newFiles={files['card'] || []}
                urlsToDelete={imagesToDelete}
                onFileChange={handleFileChange}
                onRemoveNewUrl={(file) => handleRemoveNewFile('card', file)}
                onToggleDeleteUrl={handleToggleDeleteUrl}
              />
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