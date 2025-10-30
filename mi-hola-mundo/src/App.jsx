import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button } from '@mui/material';

// --- NUEVO PROVEEDOR DE TEMA ---
import { ThemeContextProvider } from './componentes/ThemeContextProvider'; // Asegúrate de que la ruta sea correcta

// --- COMPONENTES DE AUTENTICACIÓN Y PROTECCIÓN ---
import RutaProtegida from './componentes/RutaProtegida';
import LoginControl from './componentes/LoginControl';
import LoginIntendencia from './componentes/LoginIntendencia';
import NavBarPublica from './componentes/NavBarPublica';

// --- LAYOUTS ESPECÍFICOS DE CADA MÓDULO ---
import LayoutControl from './layouts/LayoutControl';
import LayoutIntendencia from './layouts/LayoutIntendencia';

// --- PÁGINAS ---
import RegistroDiario from './pages/RegistroDiario';
import ResumenSemanal from './pages/ResumenSemanal';
import ResumenMensual from './pages/ResumenMensual';
import Intendencia from './pages/Intendencia';


// --- Tus componentes Main y ControlAsistenciasHome se quedan igual ---
function Main() {
  const navigate = useNavigate();
  return (
    <>
      <NavBarPublica />
      <Container maxWidth="lg" sx={{ pt: 5, mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Bienvenido al Sistema de Gestión
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', alignItems: 'center', gap: 3, my: 4 }}>
          <Button variant="contained" onClick={() => navigate('/control')} sx={{ fontWeight: 'bold', width: '250px', py: 1.5, fontSize: '1rem' }}>
            Control Horario
          </Button>
          <Button variant="outlined" onClick={() => navigate('/intendencia')} sx={{ fontWeight: 'bold', width: '250px', py: 1.5, fontSize: '1rem' }}>
            Control de Raciones
          </Button>
        </Box>
        <img src="/pzrp.png" alt="Logo" style={{ width: '100%', maxWidth: '250px', height: 'auto' }} />
      </Container>
    </>
  );
}

function ControlAsistenciasHome() {
  const navigate = useNavigate();
  return (
    <Container maxWidth="lg" sx={{ pt: 3, mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Control de Asistencias
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 4 }}>
        <Button variant="contained" onClick={() => navigate('/control/registro-diario')} sx={{ fontWeight: 'bold', minWidth: '200px' }}>Registro Diario</Button>
        <Button variant="outlined" onClick={() => navigate('/control/resumen-semanal')} sx={{ fontWeight: 'bold', minWidth: '200px' }}>Resumen Semanal</Button>
        <Button variant="outlined" color="primary" onClick={() => navigate('/control/resumen-mensual')} sx={{ fontWeight: 'bold', minWidth: '200px' }}>Resumen Mensual</Button>
      </Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <img src="/pzrp.png" alt="Logo" style={{ width: '100%', maxWidth: '250px', height: 'auto' }} />
      </Box>
    </Container>
  );
}
// --- Fin de los componentes que no cambian ---


function App() {
  return (
    // Envolvemos toda la aplicación con nuestro nuevo proveedor de tema
    <ThemeContextProvider>
      <Router>
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<Main />} />
          <Route path="/login/control" element={<LoginControl />} />
          <Route path="/login/intendencia" element={<LoginIntendencia />} />
          
          {/* --- MÓDULO DE CONTROL DE ASISTENCIAS (Protegido) --- */}
          <Route element={<RutaProtegida authKey="control_autenticado" loginPath="/login/control" />}>
            <Route element={<LayoutControl />}>
              <Route path="/control" element={<ControlAsistenciasHome />} />
              <Route path="/control/registro-diario" element={<RegistroDiario />} />
              <Route path="/control/resumen-semanal" element={<ResumenSemanal />} />
              <Route path="/control/resumen-mensual" element={<ResumenMensual />} />
            </Route>
          </Route>

          {/* --- MÓDULO DE CONTROL DE RACIONES (Protegido) --- */}
          <Route element={<RutaProtegida authKey="intendencia_autenticado" userKey="usuario_intendencia" loginPath="/login/intendencia" allowedRoles={['administrador', 'usuario']} />}>
            <Route element={<LayoutIntendencia />}>
              <Route path="/intendencia" element={<Intendencia />} />
            </Route>
          </Route>

          {/* --- REDIRECCIÓN --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeContextProvider>
  );
}

export default App;