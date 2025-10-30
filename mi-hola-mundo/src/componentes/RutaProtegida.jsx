// src/componentes/RutaProtegida.jsx (VERSIÓN CORRECTA Y SIMPLIFICADA)

import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';

// NOTA: Este componente ya NO importa '../MainLayout'

function RutaProtegida({ authKey, userKey, loginPath, allowedRoles }) {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem(authKey) === 'true';
  const user = JSON.parse(localStorage.getItem(userKey));

  // 1. ¿Está autenticado?
  if (!isAuthenticated) {
    // No, redirigir a la página de login que le corresponde.
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // 2. ¿Tiene el rol permitido? (si se requiere)
  if (allowedRoles && !allowedRoles.includes(user?.rol)) {
    // Sí está autenticado, pero su rol no es válido para esta ruta.
    // Lo mandamos a la página principal.
    return <Navigate to="/" replace />; 
  }

  // 3. ¡Acceso concedido!
  // Renderizamos <Outlet />, que mostrará el componente anidado en App.jsx 
  // (es decir, LayoutControl o LayoutIntendencia).
  return <Outlet />;
}

export default RutaProtegida;