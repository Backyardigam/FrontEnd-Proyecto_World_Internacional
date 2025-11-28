import React, { useState, useEffect } from 'react';

import { apiGet, apiPost, apiDelete } from '../../../utils/apiClient';

interface Tag {
  id: number;
  name: string;
}

interface TagPanelProps {
  // Tags actualmente seleccionadas para el servicio (ej: "Aventura;Paisaje")
  selectedTagsString: string;
  // Función para notificar al padre sobre cambios en la selección
  onChange: (newSelectedTagsString: string) => void;
}

export default function TagPanel({ selectedTagsString, onChange }: TagPanelProps) {
  const [allTags, setAllTags] = useState<Tag[]>([]);
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
      const tags = await apiGet<Tag[]>('/manage/tag/');
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
    if (!newTagName || allTags.some(tag => tag.name === newTagName)) {
      setError('El tag no puede estar vacío o ya existe.');
      return;
    }
    try {
      const updatedTags = await apiPost<Tag[]>('/manage/tag/', { name: newTagName });
      setAllTags(updatedTags); // El backend devuelve la lista completa de tags
      setNewTagName('');
      setError(null);
    } catch (err) {
      setError('Error al crear el tag.');
    }
  };

  // Eliminar un tag
  const handleDeleteTag = async (tagToDelete: string) => {
    const tagObject = allTags.find(t => t.name === tagToDelete);
    if (!tagObject) {
      setError('No se pudo encontrar el tag para eliminar.');
      return;
    }

    try {
      const updatedTags = await apiDelete<Tag[]>(`/manage/tag/${tagObject.id}`);
      setAllTags(updatedTags); // El backend devuelve la lista completa de tags
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
        {allTags.map(tagObj => (
          <div key={tagObj.id} className="flex items-center bg-gray-100 rounded-full">
            <button type="button" onClick={() => handleToggleTag(tagObj.name)} className={`px-3 py-1 text-sm rounded-l-full transition-colors ${selectedTags.includes(tagObj.name) ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {tagObj.name}
            </button>
            <button type="button" onClick={() => handleDeleteTag(tagObj.name)} className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-r-full transition-colors">
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