// componentes/NavBarPublica.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

const NavBarPublica = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" fontWeight="bold" sx={{ flexGrow: 1, textAlign: 'center' }}>
          SISTEMA DE GESTION PREFECTURA DE ZONA RIO DE LA PLATA
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default NavBarPublica;