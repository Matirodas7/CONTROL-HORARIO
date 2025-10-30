// src/componentes/ThemeToggleButton.jsx

import React from 'react';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import { useThemeContext } from './ThemeContextProvider';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const ThemeToggleButton = () => {
  const theme = useTheme();
  const { toggleTheme } = useThemeContext();

  return (
    <Tooltip title={theme.palette.mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}>
      <IconButton sx={{ ml: 1 }} onClick={toggleTheme} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;