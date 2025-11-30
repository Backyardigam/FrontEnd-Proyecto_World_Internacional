import React, { useState, useEffect } from "react";
import { apiGet } from "../../../utils/apiClient";
import type { ServiceGet } from "../admin_utils/servicioAdmin";
import ServicePrice from "../../homepage/seccion_servicio/ServicePrice";

interface ServicePreviewProps {
  serviceId: string;
  onClose: () => void;
}

export default function ServicePreview({ serviceId, onClose }: ServicePreviewProps) {
  const [data, setData] = useState<ServiceGet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<ServiceGet>(`/manage/service/${serviceId}`, { handle403: 'notify' })
      .then(setData)
      .catch((err) => setError(err.message || "No se pudo cargar la vista previa."))
      .finally(() => setLoading(false));
  }, [serviceId]);

  if (loading) {
    return <p>Cargando vista previa...</p>;
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md">
        <p className="text-red-500">{error}</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
          &larr; Volver a la lista
        </button>
      </div>
    );
  }

  if (!data) {
    return <p>No se encontraron datos para la vista previa.</p>;
  }

  const { service, card } = data;

  // Recreación de la Card de Astro en React
  const PreviewCard = () => (
    <div className="max-w-80 bg-white shadow-sm drop-shadow-xl rounded-xl font-redhat overflow-hidden flex flex-col">
      <div className="overflow-hidden">
        <img src={card.mediaFiles[0]} alt={`Imagen del tour ${service.name}`} className="aspect-video w-full object-cover" />
      </div>
      <div className="p-5 gap-4 flex flex-col flex-grow">
        <div className="">
          <p className="text-base">Circuito turistico</p>
          <h3 className="font-baloo font-semibold text-naranja-c text-3xl">{service.name}</h3>
          <p className="text-lg">{card.compactDescription}</p>
        </div>
        <div className="flex flex-col justify-end space-y-3 mt-auto">
          <div className="w-full border-t-2 border-gray-300"></div>
          <div className="flex items-center justify-between space-x-2">
            <div>
              <ul className="break-words list-disc list-inside text-sm text-gray-600">
                {service.tag.slice(0, 2).map(tag => <li key={tag}>{tag}</li>)}
              </ul>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ServicePrice serviceId={service.id} originalPrice={parseFloat(service.cost)} variant="minimal" />
              <div className="bg-naranja-c rounded-sm p-2 text-white min-w-[106px] text-center">
                <span aria-label={`Conoce más sobre el tour ${service.name}`}>Conoce más</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Recreación de la página de servicio de Astro en React
  const PreviewPage = () => (
    <div className="font-redhat bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full min-h-[50vh] text-white flex items-center justify-center pt-14">
        <img src={service.mediaFiles?.urlBg1} alt={`Paisaje del tour ${service.name}`} className="absolute inset-0 w-full h-full object-cover filter sepia-[.20] saturate-125" />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative w-full md:max-w-[80%] md:min-w-[65%] min-h-[50vh] bg-slate-600/30 backdrop-blur-sm flex flex-col justify-center p-8">
          <span className="font-semibold uppercase tracking-widest text-naranja-c mb-4">{service.type}</span>
          <div className="text-center self-center md:text-left mb-6">
            <h1 className="text-4xl md:text-5xl font-bold">{service.name}</h1>
            <p className="text-lg md:text-xl text-gray-300 mt-1">Circuito turístico</p>
          </div>
          <p className="mt-6 text-lg self-center text-gray-200 leading-relaxed text-left max-w-3xl">{service.fullDescription}</p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Galería de Fotos</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 -mb-4">
            {service.mediaFiles?.urlGalery?.map((url, index) => (
              <div key={index} className="flex-shrink-0 w-80 h-56 rounded-lg overflow-hidden shadow-md">
                <img src={url} alt={`Galería de ${service.name} - Imagen ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-naranja-c">Lugares que visitarás</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {service.itinerary.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="bg-stone-100/90 text-slate-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-naranja-c">Detalles del Tour</h3>
              <div className="mb-4 border-b border-gray-300 pb-4">
                <h4 className="font-semibold mb-2">Precio por persona:</h4>
                <ServicePrice serviceId={service.id} originalPrice={parseFloat(service.cost)} variant="full" />
              </div>
              <h4 className="font-semibold mb-2">Incluye:</h4>
              <ul className="list-disc list-inside space-y-1 mb-4 font-medium">
                {service.tag.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
              <h4 className="font-semibold mb-2">Horarios Disponibles:</h4>
              <ul className="list-disc list-inside space-y-1">
                {Object.values(service.schedule).map((s, i) => <li key={i}>{s.startTrip} - {s.endTrip}</li>)}
              </ul>
            </div>
        </div>
      </section>

       {/* Recommendations Section */}
       <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-naranja-c">Recomendaciones</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {service.recomendations.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-naranja-c">Información Adicional</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {service.additional.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
        </div>
       </section>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-md space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vista Previa: {service.name}</h2>
        <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
          &larr; Volver a la lista
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Columna para la Card */}
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold mb-4">Vista de Tarjeta</h3>
          <div className="flex justify-center">
            <PreviewCard />
          </div>
        </div>

        {/* Columna para la Página */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Vista de Página de Servicio</h3>
          <PreviewPage />
        </div>
      </div>
    </div>
  );
}