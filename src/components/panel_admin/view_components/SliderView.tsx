import React, { useState, useEffect } from "react";
import { apiGet, apiPostFormData, apiDelete } from "../../../utils/apiClient";
import Boton from "../admin_utils/Boton";

interface Slider {
  id: string | number;
  tagline: string;
  title: string;
  subtitle: string;
  href: string;
  url: string; // Corregido para coincidir con la respuesta de la API
}

interface SliderFormData {
  tagline: string;
  title: string;
  subtitle: string;
  href: string;
}

const SLIDER_LIMIT = 3;

// --- Componente del Formulario (definido fuera) ---
// Recibe todo lo que necesita como props.
const SliderForm = ({
  editingSlider,
  formData,
  file,
  handleSubmit,
  handleChange,
  handleFileChange,
  handleCloseForm,
  setFile,
}: {
  editingSlider: Slider | null;
  formData: Partial<SliderFormData>;
  file: File | null;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCloseForm: () => void;
  setFile: (file: File | null) => void;
}) => (
  <div className="mt-6 border-t pt-6">
    <h3 className="text-lg font-semibold mb-4">
      {editingSlider ? "Editar Slider" : "Crear Nuevo Slider"}
    </h3>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="tagline"
          value={formData.tagline || ""}
          onChange={handleChange}
          placeholder="Tagline (ej. 'Descubre')"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder="Título principal"
          className="p-2 border border-gray-300 rounded"
          required
        />
        <input
          name="subtitle"
          value={formData.subtitle || ""}
          onChange={handleChange}
          placeholder="Subtítulo"
          className="p-2 border border-gray-300 rounded"
        />
        <input
          name="href"
          value={formData.href || ""}
          onChange={handleChange}
          placeholder="URL del botón (ej. '/servicios/tour-1')"
          className="p-2 border border-gray-300 rounded"
          required
        />
      </div>
      {/* El resto del formulario se mantiene igual, usando las props */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Imagen del Slider</label>
        <div className="mt-2 flex items-center gap-4">
          <label htmlFor="file-upload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
            <span>Seleccionar archivo</span>
            <input id="file-upload" name="slider" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
          </label>
          {file ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-red-600 hover:text-red-800" title="Quitar archivo">
                &#x2715;
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-500">No se ha seleccionado ningún archivo.</span>
          )}
        </div>
        {editingSlider && !file && <p className="text-xs text-gray-500 mt-1">Sube una nueva imagen solo si deseas reemplazar la actual.</p>}
      </div>

      <div className="flex gap-4">
        <Boton text="Guardar" styleClass="bg-blue-600" type="submit" />
        <Boton
          text="Cancelar"
          styleClass="bg-gray-500"
          onPress={handleCloseForm}
        />
      </div>
    </form>
  </div>
);

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
      await apiPostFormData(url, formData, file ? { slider: [file] } : {}, {
        method,
      });
      await fetchSliders();
      handleCloseForm();
    } catch (err: any) {
      setError("Error al guardar el slider: " + err.message);
    }
  };

  const handleDelete = async (sliderToDelete: Slider) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este slider?"))
      return;

    try {
      // Enviamos la URL de la imagen en el body para que el backend pueda eliminarla.
      await apiDelete(`/manage/slider`, {
        url: sliderToDelete.url,
      });
      await fetchSliders();
    } catch (err: any) {
      setError("Error al eliminar el slider: " + err.message);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Gestión de Slider Principal
        </h2>
        {sliders.length < SLIDER_LIMIT && !isFormVisible && (
          <Boton
            text="Crear Slider"
            className="px-4 py-2 bg-naranja-c text-white font-semibold rounded-lg max-w-fit hover:bg-naranja-f"
            onPress={() => handleOpenForm(null)}
          />
        )}
      </div>

      {loading && <p>Cargando sliders...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && (
        <div className="space-y-4">
          {sliders.map((slider) => (
            <div
              key={slider.id}
              className="p-4 border border-gray-300 rounded-lg flex items-center gap-4"
            >
              <img
                src={slider.url}
                alt={slider.title}
                className="w-32 h-20 object-cover rounded-md bg-gray-200"
              />
              <div className="flex-1">
                <p className="font-semibold text-lg">{slider.title}</p>
                <p className="text-sm text-gray-600">
                  {slider.tagline} - {slider.subtitle}
                </p>
                <a
                  href={slider.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline"
                >
                  {slider.href}
                </a>
              </div>
              <div className="flex gap-2">
                <Boton
                  text="Editar"
                  styleClass="bg-yellow-600"
                  onPress={() => handleOpenForm(slider)}
                />
                <Boton
                  text="Eliminar"
                  styleClass="bg-red-600"
                  onPress={() => handleDelete(slider)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormVisible && (
        <SliderForm
          editingSlider={editingSlider}
          formData={formData}
          file={file}
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          handleCloseForm={handleCloseForm}
          setFile={setFile}
        />
      )}

      {sliders.length >= SLIDER_LIMIT && !isFormVisible && (
        <p className="text-sm text-gray-500 mt-4">
          Has alcanzado el límite de {SLIDER_LIMIT} sliders. Para crear uno
          nuevo, primero debes eliminar uno existente.
        </p>
      )}
    </div>
  );
}
