// layouts/LayoutControl.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Snackbar, Alert } from '@mui/material';

// Importa los componentes específicos para este módulo
import NavBarControl from '../componentes/NavBarControl';
import NavigationDrawerControl from '../componentes/NavigationDrawerControl';

const drawerWidth = 230;
const INACTIVITY_TIMEOUT = 900000; // 15 minutos

const LayoutControl = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inactivityMessageOpen, setInactivityMessageOpen] = useState(false);
  const navigate = useNavigate();
  const inactivityTimer = useRef(null);

  // Lógica de logout específica para Control Horario
  const handleLogout = useCallback(() => {
    localStorage.removeItem('control_autenticado');
    localStorage.removeItem('usuario_control');
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    navigate('/'); // Redirige a la página principal pública
  }, [navigate]);

  // Timer de inactividad que solo vigila la sesión de Control Horario
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (localStorage.getItem('control_autenticado') === 'true') {
      inactivityTimer.current = setTimeout(() => {
        setInactivityMessageOpen(true);
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [handleLogout]);

  useEffect(() => {
    const activityEvents = ['mousemove', 'keypress', 'click', 'scroll'];
    const handleActivity = () => resetInactivityTimer();
    resetInactivityTimer(); // Inicia el timer al montar el layout
    activityEvents.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [resetInactivityTimer]);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleDrawerClose = () => setDrawerOpen(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <NavBarControl handleDrawerToggle={handleDrawerToggle} handleLogout={handleLogout} />
      <NavigationDrawerControl open={drawerOpen} onClose={handleDrawerClose} drawerWidth={drawerWidth} />
      
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '64px' }}>
        {/* Aquí se renderiza la página actual del módulo (ej: RegistroDiario) */}
        <Outlet />
      </Box>

      <Snackbar open={inactivityMessageOpen} autoHideDuration={4000} onClose={() => setInactivityMessageOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" sx={{ width: '100%' }}>
          Sesión de Control Horario cerrada por inactividad.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LayoutControl;