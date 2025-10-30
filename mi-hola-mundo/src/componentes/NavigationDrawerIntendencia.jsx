// componentes/NavigationDrawerIntendencia.jsx
import React from 'react';
import { Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Toolbar, useTheme } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
// Importamos iconos relevantes para este módulo
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NoFoodIcon from '@mui/icons-material/NoFood';

const NavigationDrawerIntendencia = ({ open, onClose, variant = "temporary", drawerWidth }) => {
    const location = useLocation();
    const theme = useTheme();

    // --- Lógica de Roles ---
    const usuario = JSON.parse(localStorage.getItem('usuario_intendencia'));
    const userRole = usuario?.rol; // 'administrador' o 'usuario'

    // Definimos TODOS los posibles elementos del menú, cada uno con una propiedad "roles"
    const allMenuItems = [
        { text: 'Gestión de Raciones', icon: <RestaurantMenuIcon />, path: '/intendencia', roles: ['usuario', 'administrador'] },
        { text: 'Informes de Consumo', icon: <BarChartIcon />, path: '/intendencia/reportes', roles: ['administrador'] },
        { text: 'Gestión de Excepciones', icon: <NoFoodIcon />, path: '/intendencia/excepciones', roles: ['administrador'] },
        { text: 'Panel de Admin', icon: <AdminPanelSettingsIcon />, path: '/intendencia/admin', roles: ['administrador'] },
    ];

    // Filtramos la lista para obtener solo los elementos que el rol actual puede ver
    const visibleItems = allMenuItems.filter(item => 
        userRole && item.roles.includes(userRole)
    );

    // El resto del código es idéntico, pero ahora mapea sobre "visibleItems"
    const drawerContent = (
        <>
            <Toolbar />
            <Box sx={{ overflow: 'auto', flexGrow: 1, backgroundColor: theme.palette.drawerBackground }}>
                <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)' }} />
                <List sx={{ paddingTop: 0 }}>
                    {/* MODIFICADO: Mapeamos sobre la lista filtrada */}
                    {visibleItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={location.pathname.startsWith(item.path)}
                                onClick={onClose}
                                sx={{
                                    color: theme.palette.drawerText,
                                    '& .MuiListItemIcon-root': { color: theme.palette.drawerText, minWidth: '40px' },
                                    // Usamos 'secondary' para el color seleccionado, para que coincida con la NavBar
                                    '&.Mui-selected': {
                                        backgroundColor: theme.palette.secondary.dark,
                                        color: theme.palette.secondary.contrastText,
                                        '& .MuiListItemIcon-root': { color: theme.palette.secondary.contrastText },
                                        '&:hover': { backgroundColor: theme.palette.secondary.dark }
                                    },
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.08)'
                                    },
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </>
    );

    return (
        <Drawer variant={variant} open={open} onClose={onClose} ModalProps={{ keepMounted: true }}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: theme.palette.drawerBackground,
                    color: theme.palette.drawerText,
                    borderRight: 'none',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default NavigationDrawerIntendencia;