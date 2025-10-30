// componentes/NavBarControl.jsx
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// --- 1. Importa el nuevo componente del botón de tema ---
import ThemeToggleButton from './ThemeToggleButton';

const NavBarControl = ({ handleDrawerToggle, handleLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario_control');
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleCerrarSesionClick = () => {
    handleClose();
    if (handleLogout) handleLogout();
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'center' }}>
          CONTROL HORARIO PREFECTURA DE ZONA RIO DE LA PLATA
        </Typography>

        {/* --- 2. Añade el botón de cambio de tema aquí --- */}
        <ThemeToggleButton />

        {usuario && (
          <div>
            <Tooltip title="Opciones de usuario">
              <IconButton onClick={handleMenu} color="inherit">
                <Avatar src={usuario.foto || ''} alt={usuario.nombre || 'U'} sx={{ width: 32, height: 32 }}>
                  {!usuario.foto && getInitials(usuario.nombre)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
              <MenuItem disabled>{usuario.nombre}</MenuItem>
              <MenuItem onClick={handleCerrarSesionClick}>Cerrar sesión</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBarControl;