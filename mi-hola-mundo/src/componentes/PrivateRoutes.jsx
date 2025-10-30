// PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const isAuthenticated = localStorage.getItem('autenticado'); // Verificar si el usuario está autenticado

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />; // Redirigir al login si no está autenticado
  }

  return <Outlet />; // Si está autenticado, renderizar las rutas protegidas
};

export default PrivateRoute;
