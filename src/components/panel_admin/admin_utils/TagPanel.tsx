import React, { useState, useEffect, useMemo } from 'react';

import { apiGet, apiPost, apiDelete } from '../../../utils/apiClient';

// Un tipo extendido para saber el estado de cada tag que se muestra
type DisplayTag = {
  id: number | string; // Usamos string para tags huérfanos
  name: string;
  isOrphan: boolean; // true si no existe en la BD de tags
};

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
  const [globalTags, setGlobalTags] = useState<Tag[]>([]);
  const [initialOrphanTags, setInitialOrphanTags] = useState<string[]>([]);
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
      const tagsFromApi = await apiGet<Tag[]>('/manage/tag/');
      setGlobalTags(tagsFromApi);

      // Una vez cargados los tags globales, identificamos los huérfanos iniciales.
      const selectedTagNames = selectedTagsString ? selectedTagsString.split(';').filter(Boolean) : [];
      const globalTagNames = new Set(tagsFromApi.map(t => t.name));
      const orphans = selectedTagNames.filter(name => !globalTagNames.has(name));
      setInitialOrphanTags(orphans);

    } catch (err) {
      setError('No se pudieron cargar los tags.');
    } finally {
      setLoading(false);
    }
  };

  // Hook que combina los tags globales con los tags "huérfanos" que vienen del servicio
  const displayTags = useMemo<DisplayTag[]>(() => {
    const allDisplayTags: DisplayTag[] = globalTags.map(tag => ({
      ...tag,
      isOrphan: false,
    }));

    // Añadimos los tags huérfanos iniciales que recordamos en el estado.
    initialOrphanTags.forEach(name => {
      if (!allDisplayTags.some(dt => dt.name === name)) {
        allDisplayTags.push({
          id: `orphan-${name}`,
          name: name,
          isOrphan: true,
        });
      }
    });
    return allDisplayTags;
  }, [globalTags, initialOrphanTags]);

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
    if (!newTagName || globalTags.some(tag => tag.name === newTagName)) {
      setError('El tag no puede estar vacío o ya existe.');
      return;
    }
    try {
      const updatedTags = await apiPost<Tag[]>('/manage/tag/', { name: newTagName });
      setGlobalTags(updatedTags); // El backend devuelve la lista completa de tags
      setNewTagName('');
      setError(null);
    } catch (err) {
      setError('Error al crear el tag.');
    }
  };

  // Eliminar un tag
  const handleDeleteTag = async (tagToDelete: string) => {
    const tagObject = globalTags.find(t => t.name === tagToDelete);
    if (!tagObject) {
      // Si es un tag huérfano, simplemente lo quitamos de la selección
      if (selectedTags.includes(tagToDelete)) {
        handleToggleTag(tagToDelete);
        setError(null);
      } else {
        setError('No se pudo encontrar el tag para eliminar.');
      }
      return;
    }

    // Si es un tag global, lo eliminamos de la BD
    try {
      const updatedTags = await apiDelete<Tag[]>(`/manage/tag/${tagObject.id}`);
      setGlobalTags(updatedTags); // El backend devuelve la lista completa de tags
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
        {displayTags.map(tag => {
          const isSelected = selectedTags.includes(tag.name);
          const buttonClass = isSelected
            ? 'bg-blue-600 text-white'
            : tag.isOrphan
            ? 'bg-yellow-200 text-yellow-800 border border-dashed border-yellow-400 hover:bg-yellow-300'
            : 'bg-gray-200 hover:bg-gray-300';

          return (
            <div key={tag.id} className="flex items-center bg-gray-100 rounded-full">
              <button type="button" onClick={() => handleToggleTag(tag.name)} className={`px-3 py-1 text-sm rounded-l-full transition-colors ${buttonClass}`}>
                {tag.name}
              </button>
              <button type="button" onClick={() => handleDeleteTag(tag.name)} className="px-2 py-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-r-full transition-colors" title={tag.isOrphan ? "Quitar este tag del servicio" : "Eliminar este tag de la base de datos"}>
              &#x2715;
              </button>
            </div>
          );
        })}
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