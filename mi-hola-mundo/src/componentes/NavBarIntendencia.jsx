// componentes/NavBarIntendencia.jsx
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Menu, MenuItem, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const NavBarIntendencia = ({ handleDrawerToggle, handleLogout }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        // MODIFICADO: Usa la clave específica para el usuario de intendencia
        const usuarioGuardado = localStorage.getItem('usuario_intendencia');
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
        // MODIFICADO: Usamos el color 'secondary' para diferenciarlo visualmente
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
                <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" component="div" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'center' }}>
                    CONTROL DE RACIONES PREFECTURA DE ZONA RIO DE LA PLATA
                </Typography>
                {usuario && (
                    <div>
                        <IconButton onClick={handleMenu} color="inherit">
                            <Avatar src={usuario.foto || ''} alt={usuario.nombre || 'U'}>
                                {!usuario.foto && getInitials(usuario.nombre)}
                            </Avatar>
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                            <MenuItem disabled>{usuario.nombre} ({usuario.rol})</MenuItem> {/* Mostramos el rol */}
                            <MenuItem onClick={handleCerrarSesionClick}>Cerrar sesión</MenuItem>
                        </Menu>
                    </div>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default NavBarIntendencia;