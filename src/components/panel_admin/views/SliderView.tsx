import React, { useState, useEffect } from "react";
import { apiGet, apiPostFormData, apiDelete } from "../../../utils/apiClient";
import Boton from "../admin_utils/Boton";

interface Slider {
  id: string;
  tagline: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string;
}

interface SliderFormData {
  tagline: string;
  title: string;
  subtitle: string;
  href: string;
}

const SLIDER_LIMIT = 3;

export default function SliderView() {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el formulario (crear o editar)
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [formData, setFormData] = useState<Partial<SliderFormData>>({});
  const [file, setFile] = useState<File | null>(null);

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const data = await apiGet<Slider[]>("/manage/slider");
      setSliders(data);
      setError(null);
    } catch (err: any) {
      setError("Error al cargar los sliders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleOpenForm = (slider: Slider | null) => {
    setEditingSlider(slider);
    setFormData(
      slider
        ? {
            tagline: slider.tagline,
            title: slider.title,
            subtitle: slider.subtitle,
            href: slider.href,
          }
        : { tagline: "", title: "", subtitle: "", href: "" }
    );
    setFile(null);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setIsFormVisible(false);
    setEditingSlider(null);
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = editingSlider
      ? `/manage/slider/${editingSlider.id}`
      : "/manage/slider";
    const method = editingSlider ? "PATCH" : "POST";

    // En modo creación, la imagen es obligatoria
    if (!editingSlider && !file) {
      setError("La imagen es obligatoria al crear un nuevo slider.");
      return;
    }

    try {
      await apiPostFormData(
        url,
        formData,
        file ? { slider: [file] } : {},
        { method }
      );
      await fetchSliders();
      handleCloseForm();
    } catch (err: any) {
      setError("Error al guardar el slider: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este slider?"))
      return;

    try {
      // La ruta DELETE /manage/slider podría requerir el ID en el body
      // si no lo acepta en la URL. Asumimos que lo acepta en el body.
      await apiDelete(`/manage/slider/${id}`);
      await fetchSliders();
    } catch (err: any) {
      setError("Error al eliminar el slider: " + err.message);
    }
  };

  const SliderForm = () => (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">
        {editingSlider ? "Editar Slider" : "Crear Nuevo Slider"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="tagline" value={formData.tagline || ""} onChange={handleChange} placeholder="Tagline (ej. 'Descubre')" className="p-2 border border-gray-300 rounded" />
          <input name="title" value={formData.title || ""} onChange={handleChange} placeholder="Título principal" className="p-2 border border-gray-300 rounded" required />
          <input name="subtitle" value={formData.subtitle || ""} onChange={handleChange} placeholder="Subtítulo" className="p-2 border border-gray-300 rounded" />
          <input name="href" value={formData.href || ""} onChange={handleChange} placeholder="URL del botón (ej. '/servicios/tour-1')" className="p-2 border border-gray-300 rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Imagen del Slider</label>
          <input type="file" name="slider" onChange={handleFileChange} accept="image/*" className="mt-1" />
          {editingSlider && <p className="text-xs text-gray-500 mt-1">Sube una nueva imagen solo si deseas reemplazar la actual.</p>}
        </div>
        <div className="flex gap-4">
          <Boton text="Guardar" styleClass="bg-blue-600" type="submit" />
          <Boton text="Cancelar" styleClass="bg-gray-500" onPress={handleCloseForm} />
        </div>
      </form>
    </div>
  );

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Gestión de Slider Principal
        </h2>
        {sliders.length < SLIDER_LIMIT && !isFormVisible && (
          <Boton
            text="Crear Slider"
            styleClass="bg-green-600"
            onPress={() => handleOpenForm(null)}
          />
        )}
      </div>

      {loading && <p>Cargando sliders...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && (
        <div className="space-y-4">
          {sliders.map((slider) => (
            <div key={slider.id} className="p-4 border rounded-lg flex items-center gap-4">
              <img src={slider.imageUrl} alt={slider.title} className="w-32 h-20 object-cover rounded-md bg-gray-200" />
              <div className="flex-1">
                <p className="font-semibold text-lg">{slider.title}</p>
                <p className="text-sm text-gray-600">{slider.tagline} - {slider.subtitle}</p>
                <a href={slider.href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">{slider.href}</a>
              </div>
              <div className="flex gap-2">
                <Boton text="Editar" styleClass="bg-yellow-600" onPress={() => handleOpenForm(slider)} />
                <Boton text="Eliminar" styleClass="bg-red-600" onPress={() => handleDelete(slider.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormVisible && <SliderForm />}

      {sliders.length >= SLIDER_LIMIT && !isFormVisible && (
        <p className="text-sm text-gray-500 mt-4">
          Has alcanzado el límite de {SLIDER_LIMIT} sliders. Para crear uno nuevo, primero debes eliminar uno existente.
        </p>
      )}
    </div>
  );
}