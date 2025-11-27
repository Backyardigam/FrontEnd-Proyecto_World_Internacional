import React, { useState, useEffect } from 'react';

import { apiGet, apiPost, apiDelete } from '../../../utils/apiClient';

interface TagPanelProps {
  // Tags actualmente seleccionadas para el servicio (ej: "Aventura;Paisaje")
  selectedTagsString: string;
  // Función para notificar al padre sobre cambios en la selección
  onChange: (newSelectedTagsString: string) => void;
}

export default function TagPanel({ selectedTagsString, onChange }: TagPanelProps) {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedTags = selectedTagsString ? selectedTagsString.split(';') : [];

  // Cargar todos los tags al montar el componente
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
// Simulación de API GET /manage/tag/
      // const mockTags = ["Aventura", "Paisaje", "Full Day", "Gastronomía", "Cultural", "Nocturno"];
      // setTimeout(() => {
      //   setAllTags(mockTags);
      //   setLoading(false);
      // }, 500);
      
      const tags = await apiGet<string[]>('/manage/tag/');
      setAllTags(tags);
    } catch (err) {
      setError('No se pudieron cargar los tags.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar la selección/deselección de un tag
  const handleToggleTag = (tag: string) => {
    // Si el usuario intenta AÑADIR un tag y ya ha alcanzado el límite de 2...
    if (!selectedTags.includes(tag) && selectedTags.length >= 2) {
      setError('No se pueden seleccionar más de 2 tags.');
      return; // ...no hacemos nada
    }
    setError(null); // Limpiamos cualquier error anterior

    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onChange(newSelectedTags.join(';'));
  };

  // Crear un nuevo tag
  const handleCreateTag = async () => {
    if (!newTagName || allTags.includes(newTagName)) {
      setError('El tag no puede estar vacío o ya existe.');
      return;
    }
    try {
      await apiPost('/manage/tag/', { name: newTagName });
      setAllTags([...allTags, newTagName]); // Actualiza la UI inmediatamente
      setNewTagName('');
      setError(null);
    } catch (err) {
      setError('Error al crear el tag.');
    }
  };

  // Eliminar un tag
  const handleDeleteTag = async (tagToDelete: string) => {
    try {
      await apiDelete(`/manage/tag/${tagToDelete}`);
      setAllTags(allTags.filter(t => t !== tagToDelete)); // Actualiza la UI
      // También lo eliminamos de la selección actual si estaba seleccionado
      if (selectedTags.includes(tagToDelete)) {
        handleToggleTag(tagToDelete);
      }
    } catch (err) {
      setError('Error al eliminar el tag.');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Cargando tags...</p>;

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <label className="block text-sm font-medium text-gray-700 mb-2">Tags del Servicio</label>
      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
      
      {/* Lista de tags seleccionables */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allTags.map(tag => (
          <div key={tag} className="flex items-center bg-gray-100 rounded-full">
            <button type="button" onClick={() => handleToggleTag(tag)} className={`px-3 py-1 text-sm rounded-l-full transition-colors ${selectedTags.includes(tag) ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {tag}
            </button>
            <button type="button" onClick={() => handleDeleteTag(tag)} className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-r-full transition-colors">
              &#x2715;
            </button>
          </div>
        ))}
      </div>

      {/* Formulario para crear nuevo tag */}
      <div className="flex items-center gap-2 border-t pt-4">
        <input
          type="text"
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          placeholder="Nombre del nuevo tag"
          className="flex-grow px-3 py-1.5 text-sm border border-gray-300 rounded-md"
        />
        <button type="button" onClick={handleCreateTag} className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700">
          Crear Tag
        </button>
      </div>
    </div>
  );
}