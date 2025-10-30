// componentes/LoginIntendencia.js
import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import NavBar from './NavBarControl';
import { usuariosIntendencia } from './UsuariosIntendencia'; // Importamos los usuarios de intendencia

const LoginIntendencia = () => {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    const usuarioValido = usuariosIntendencia.find(
      (u) => u.usuario === usuario && u.contraseña === contraseña
    );

    if (usuarioValido) {
      // Usamos claves específicas para intendencia y guardamos el rol
      localStorage.setItem('intendencia_autenticado', 'true');
      localStorage.setItem(
        'usuario_intendencia',
        JSON.stringify({
          nombre: usuarioValido.nombreCompleto,
          rol: usuarioValido.rol, // ¡Guardamos el rol!
          foto: '/pzrp.png',
        })
      );
       // Redirigir a la página de la que vino o a /intendencia por defecto
      const from = location.state?.from?.pathname || '/intendencia';
      navigate(from, { replace: true });
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    // JSX similar al otro login, pero con título diferente
    <>
      <NavBar mostrarAvatar={false} />
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" minHeight="calc(100vh - 64px)">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} p={3} borderRadius={2} boxShadow={3} sx={{ backgroundColor: 'background.paper', width: { xs: '90%', sm: '400px' }, maxWidth: '400px', marginTop: '15vh' }}>
          <Typography variant="h4" fontWeight="bold">Control Raciones</Typography>
          <TextField label="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} onKeyDown={handleKeyDown} required fullWidth />
          <TextField label="Contraseña" type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} onKeyDown={handleKeyDown} required fullWidth />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button variant="contained" onClick={handleLogin} fullWidth>Ingresar</Button>
        </Box>
      </Box>
    </>
  );
};

export default LoginIntendencia;