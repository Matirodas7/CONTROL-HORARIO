// src/theme.js
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

// --- BASE DE TIPOGRAFÍA COMÚN ---
// Definimos los estilos de fuente una vez para mantener la consistencia.
// Los colores se asignarán específicamente en cada tema.
const commonTypography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700 },
  h2: { fontWeight: 700 },
  h3: { fontWeight: 700 },
  h4: { fontWeight: 700 }, // Título principal de las páginas
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 }, // Títulos de tarjetas o secciones
  subtitle1: { fontWeight: 500 },
};

// --- TEMA CLARO (Light Theme) ---
let lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1765af',
      dark: '#003c7f',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212B36',
      secondary: '#637381',
    },
  },
  typography: {
    ...commonTypography,
    // Asignamos colores específicos para el tema claro
    h4: {
      ...commonTypography.h4,
      color: '#003c7f', // Color oscuro del primario
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#1765af', // Color primario del tema
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
    },
  },
});

// --- TEMA OSCURO (Dark Theme) ---
let darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64B5F6', // Azul más brillante para contraste
    },
    secondary: {
      main: '#F48FB1', // Rosa más brillante
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#BDBDBD',
    },
  },
  typography: {
    ...commonTypography,
    // Asignamos colores específicos para el tema oscuro
    h4: {
      ...commonTypography.h4,
      color: '#64B5F6', // Color primario del tema oscuro
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          // La sombra en modo oscuro es diferente
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', 
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#1E1E1E', // Fondo de 'paper' para un look sutil
          color: '#FFFFFF',
          fontWeight: 600,
          borderBottom: '1px solid #424242',
        },
      },
    },
  },
});

// Hacemos las fuentes responsivas (se adaptan al tamaño de pantalla)
lightTheme = responsiveFontSizes(lightTheme);
darkTheme = responsiveFontSizes(darkTheme);

// Exportamos ambos temas para que nuestro ThemeContextProvider los use
export { lightTheme, darkTheme };