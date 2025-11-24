// // En tu archivo de rutas principal (ej: App.tsx)
// import { Routes, Route, Navigate } from 'react-router-dom';
// import { AdminPanel } from './components/panel_admin/panel_admin';
// import { LoginPage } from './components/login_admin/login_admin';

// // Un componente hipotético que envuelve las rutas protegidas
// const ProtectedRoute = ({ children }) => {
//   // Lógica para obtener el usuario actual y su rol
//   // (esto podría venir de un Context, Redux, o localStorage)
//   const { isAuthenticated, userRole } = useAuth(); 

//   if (!isAuthenticated) {
//     // Si no está autenticado, redirigir al login
//     return <Navigate to="/login-admin" />;
//   }

//   if (userRole !== 'admin' && userRole !== 'superadmin') {
//     // Si está autenticado pero no tiene el rol correcto,
//     // redirigir a otra página (ej: la home)
//     return <Navigate to="/" />;
//   }

//   // Si pasa todas las validaciones, renderiza el componente hijo (AdminPanel)
//   return children;
// };

// // ... dentro de tu componente App
// <Routes>
//   <Route path="/login-admin" element={<LoginPage />} />
  
//   {/* Ruta protegida para el panel de administración */}
//   <Route 
//     path="/admin/*" // El '/*' permite sub-rutas dentro del panel
//     element={
//       <ProtectedRoute>
//         <AdminPanel />
//       </ProtectedRoute>
//     } 
//   />

//   {/* ...otras rutas públicas de tu aplicación ... */}
//   <Route path="/" element={<HomePage />} />
// </Routes>
