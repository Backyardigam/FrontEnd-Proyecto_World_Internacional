import React, { useState, useEffect } from 'react';
import { apiGet, apiPostFormData } from '../../../utils/apiClient';
import type { IServiceRequest } from '../admin_utils/servicioAdmin';

interface ServiceFormProps {
  serviceId: string | null; // null para 'Crear', un ID para 'Editar'
  onClose: () => void; // Función para cerrar el formulario
  onSave: () => void; // Función para refrescar la lista después de guardar
}

export default function ServiceForm({ serviceId, onClose, onSave }: ServiceFormProps) {
  const [formData, setFormData] = useState<Partial<IServiceRequest>>({});
  const [files, setFiles] = useState<Record<string, File | File[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = serviceId !== null;

  useEffect(() => {
    if (isEditMode) {
      setLoading(true);
      apiGet(`/manage/${serviceId}`, { redirectPath: '/core-tacana-wits-7b345' })
        .then(data => {
          setFormData(data);
          setLoading(false);
        })
        .catch(err => {
          setError('Error al cargar los datos del servicio.');
          setLoading(false);
        });
    } else {
      // Resetea el formulario para el modo 'Crear'
      setFormData({
        name: '',
        cost: 0,
        type: 'tour',
        serviceState: 'visible',
      });
    }
  }, [serviceId, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isEditMode ? `/manage/${serviceId}` : '/manage';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      await apiPostFormData(url, formData, files, { method, redirectPath: '/core-tacana-wits-7b345' });
      onSave(); // Llama a la función para refrescar la lista
      onClose(); // Cierra el formulario
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al guardar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <p>Cargando formulario...</p>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Editar Servicio' : 'Crear Nuevo Servicio'}</h2>
        
        {error && <div className="p-3 text-red-700 bg-red-100 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Servicio</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Aquí irían todos los demás campos del formulario (cost, description, etc.) */}
          {/* Por ahora, solo el nombre como ejemplo */}

          <div className="border-t pt-4 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}