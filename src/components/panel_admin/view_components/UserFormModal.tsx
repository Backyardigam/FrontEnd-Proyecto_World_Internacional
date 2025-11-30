import React, { useState, useEffect } from 'react';
import type { User, UserFormData } from '../admin_utils/usuarioAdmin';
import Boton from '../admin_utils/Boton';
import { ApiError } from '../../../utils/apiClient';

interface Props {
  user: User | null;
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
}

export default function UserFormModal({ user, onClose, onSave }: Props) {
  const [formData, setFormData] = useState<UserFormData>({
    role: 'employee',
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!user;

  useEffect(() => {
    if (isEditMode && user) {
      setFormData({
        id: user.id,
        role: user.role === 'admin' ? 'admin' : 'employee',
        username: user.username || '',
        email: user.email || '',
        password: '', // La contraseña siempre se deja en blanco al editar
      });
    }
  }, [user, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: value };
      // Si cambia el rol, limpiamos el campo que no corresponde
      if (name === 'role') {
        if (value === 'admin') {
          newState.username = '';
        } else {
          newState.email = '';
        }
      }
      return newState;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validación
    if (formData.role === 'admin' && !formData.email) {
      setError('El email es obligatorio para los administradores.');
      return;
    }
    if (formData.role === 'employee' && !formData.username) {
      setError('El nombre de usuario es obligatorio para los empleados.');
      return;
    }
    if (!isEditMode && !formData.password) {
      setError('La contraseña es obligatoria al crear un nuevo usuario.');
      return;
    }

    setLoading(true);
    try {
      // Preparamos el payload final, eliminando campos vacíos
      const payload: UserFormData = { role: formData.role };
      if (formData.role === 'admin') payload.email = formData.email;
      if (formData.role === 'employee') payload.username = formData.username;
      if (formData.password) payload.password = formData.password;

      await onSave(payload);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Editar Usuario' : 'Crear Usuario'}</h2>
        {error && <div className="p-3 text-red-700 bg-red-100 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md">
              <option value="admin">Admin</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          {formData.role === 'admin' ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
          ) : (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" required />
            </div>
          )}

          <div>
            <label htmlFor="password">{isEditMode ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" placeholder={isEditMode ? 'Dejar en blanco para no cambiar' : ''} required={!isEditMode} />
          </div>

          <div className="border-t pt-4 flex justify-end gap-4">
            <Boton text="Cancelar" styleClass="bg-gray-200 text-gray-800" onPress={onClose} />
            <Boton text={loading ? 'Guardando...' : 'Guardar'} styleClass="bg-blue-600" type="submit" disabled={loading} />
          </div>
        </form>
      </div>
    </div>
  );
}