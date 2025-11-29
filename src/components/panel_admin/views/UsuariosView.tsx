import React, { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, ApiError } from '../../../utils/apiClient';
import UserFormModal from '../admin_utils/UserFormModal';
import type { User, UserFormData } from '../admin_utils/usuarioAdmin';
import Boton from '../admin_utils/Boton';

const roleOrder: Record<User['role'], number> = {
  superadmin: 1,
  admin: 2,
  employee: 3,
  user: 4,
  guest: 5,
};

const getStateStyles = (state: User['accountState']) => {
  switch (state) {
    case 'verified':
      return 'bg-green-100 text-green-800';
    case 'suspended':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UsuariosView() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUsers = await apiGet<User[]>('/users/');
      // Ordenar usuarios por rol
      fetchedUsers.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (formData: UserFormData) => {
    try {
      if (editingUser) {
        // Actualizar usuario (PUT)
        await apiPut(`/users/${editingUser.id}`, formData);
      } else {
        // Crear usuario (POST)
        await apiPost('/users/', formData);
      }
      await fetchUsers(); // Refrescar la lista
      handleCloseModal();
    } catch (err) {
      if (err instanceof ApiError) {
        throw err; // Re-lanzar para que el modal lo muestre
      }
      throw new Error('Ocurrió un error inesperado.');
    }
  };

  const handleToggleSuspend = async (user: User) => {
    const action = user.accountState === 'suspended' ? 'unsuspend' : 'suspend';
    const confirmationText = action === 'suspend'
      ? `¿Seguro que quieres suspender a ${user.username || user.email}?`
      : `¿Seguro que quieres reactivar a ${user.username || user.email}?`;

    if (!window.confirm(confirmationText)) return;

    try {
      await apiPatch(`/users/${user.id}/${action}`, {});
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || `Error al ${action === 'suspend' ? 'suspender' : 'reactivar'} el usuario.`);
    }
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${user.username || user.email}? Esta acción es irreversible.`)) return;

    try {
      await apiDelete(`/users/${user.id}`);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el usuario.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <Boton text="Crear Usuario" styleClass="bg-blue-600" onPress={() => handleOpenModal()} />
      </div>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identificador</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.email || user.username}</div>
                    <div className="text-sm text-gray-500">{user.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStateStyles(user.accountState)} capitalize`}>
                      {user.accountState}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.role !== 'superadmin' && (
                      <div className="flex items-center justify-end gap-2">
                        <Boton text="Editar" styleClass="bg-yellow-500 text-white" onPress={() => handleOpenModal(user)} />
                        <Boton
                          text={user.accountState === 'suspended' ? 'Reactivar' : 'Suspender'}
                          styleClass={user.accountState === 'suspended' ? 'bg-teal-500 text-white' : 'bg-gray-500 text-white'}
                          onPress={() => handleToggleSuspend(user)}
                        />
                        <Boton text="Eliminar" styleClass="bg-red-600 text-white" onPress={() => handleDelete(user)} />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <UserFormModal
          user={editingUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
