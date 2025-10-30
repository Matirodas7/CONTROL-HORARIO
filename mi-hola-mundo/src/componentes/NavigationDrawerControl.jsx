import React from 'react';
import {
    Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, Typography, Toolbar, useTheme
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';

const NavigationDrawerControl = ({ open, onClose, variant = "temporary", drawerWidth }) => {
    const location = useLocation();
    const theme = useTheme();

    const menuItems = [
        { text: 'Menú', icon: <DashboardIcon />, path: '/control' },
        { text: 'Registro Diario', icon: <TodayIcon />, path: '/control/registro-diario' },
        { text: 'Resumen Semanal', icon: <DateRangeIcon />, path: '/control/resumen-semanal' },
        { text: 'Resumen Mensual', icon: <CalendarMonthIcon />, path: '/control/resumen-mensual' },
    ];

    const drawerContent = (
        <>
            <Toolbar />
            <Box sx={{ overflow: 'auto', flexGrow: 1, backgroundColor: theme.palette.drawerBackground }}>
                <Divider sx={{ borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)' }} />
                <List sx={{ paddingTop: 0 }}>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                selected={location.pathname === item.path}
                                onClick={onClose}
                                sx={{
                                    color: theme.palette.drawerText,
                                    '& .MuiListItemIcon-root': { color: theme.palette.drawerText, minWidth: '40px' },
                                    '&.Mui-selected': {
                                        backgroundColor: theme.palette.primary.dark,
                                        color: theme.palette.primary.contrastText,
                                        '& .MuiListItemIcon-root': { color: theme.palette.primary.contrastText },
                                        '&:hover': { backgroundColor: theme.palette.primary.dark, }
                                    },
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
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
        <Drawer
            variant={variant}
            open={open}
            onClose={onClose}
            ModalProps={{
                keepMounted: true,
            }}
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: theme.palette.drawerBackground,
                    color: theme.palette.drawerText,
                    borderRight: 'none',
                    overflowX: 'hidden',
                },
            }}
        >
            {drawerContent}
        </Drawer>
    );
};

export default NavigationDrawerControl;