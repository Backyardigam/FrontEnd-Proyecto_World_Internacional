export interface User {
    id: string;
    email: string | null;
    username: string | null;
    role: 'user' | 'guest' | 'employee' | 'admin' | 'superadmin';
    accountState: 'pending' | 'verified' | 'suspended';
  }
  
  export interface UserFormData {
    id?: string;
    role: 'employee' | 'admin';
    // Usamos '?' porque uno de los dos será requerido según el rol,
    // pero no ambos al mismo tiempo. La lógica del form lo manejará.
    email?: string;
    username?: string;
    // La contraseña es opcional al editar, pero requerida al crear.
    password?: string;
  }
  
