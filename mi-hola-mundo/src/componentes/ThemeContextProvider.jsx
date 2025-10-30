// src/componentes/ThemeContextProvider.jsx

import React, { createContext, useState, useMemo, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme/Theme'; // Importa los temas desde theme.js

// 1. Creamos el Contexto
const ThemeContext = createContext({
  toggleTheme: () => {},
});

// Hook personalizado para usar el contexto fácilmente en otros componentes
export const useThemeContext = () => useContext(ThemeContext);

// 2. Creamos el Componente Proveedor
export const ThemeContextProvider = ({ children }) => {
  // Leemos la preferencia del usuario del localStorage, o usamos 'light' por defecto
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  // Guardamos la preferencia en localStorage cada vez que cambia
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Función para cambiar el tema
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Seleccionamos el tema actual (light o dark) basado en el estado 'mode'
  // useMemo optimiza esto para que el tema no se recalcule en cada render
  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline /> {/* Aplica los estilos base (como el color de fondo) */}
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};