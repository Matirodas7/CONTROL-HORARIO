import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import NavBar from './NavBarControl';

// Usuarios hardcodeados
const usuariosValidos = [
  //JEFES
  { usuario: 'admin', contraseña: 'pzrp-2025', foto: '/avatars/', },
  { usuario: '22086871', contraseña: 'pzrp-2025', foto: '/avatars/', },//MOYANO
  { usuario: '23787036', contraseña: 'pzrp-2025', foto: '/avatars/', },//IGLESIAS
  { usuario: '23503471', contraseña: 'pzrp-2025', foto: '/avatars/', },//PAULINA
  { usuario: '30275494', contraseña: 'pzrp-2025', foto: '/avatars/', },//GONZALEZ
  { usuario: '27800279', contraseña: 'daci-2025', foto: '/avatars/', },//SEGURA
  { usuario: '21739441', contraseña: 'jurid-2025', foto: '/avatars/', },//GINESI
  { usuario: '40189792', contraseña: 'jurid-2025', foto: '/avatars/', },//GINESI
  { usuario: '30166541', contraseña: 'genero-2025', foto: '/avatars/', },//WENECKE
  { usuario: '34365100', contraseña: 'genero-2025', foto: '/avatars/', },//ACOSTA
  { usuario: '31098336', contraseña: 'oper-2025', foto: '/avatars/', },//GOMEZ
  { usuario: '37467703', contraseña: 'personal-2025', foto: '/avatars/', },//RODAS
  { usuario: '39559921', contraseña: 'material-2025', foto: '/avatars/', },//QUIÑONES
  { usuario: '35689141', contraseña: 'personal-2025', foto: '/avatars/', },//ACUÑA
  { usuario: '37474371', contraseña: 'pañol-2025', foto: '/avatars/', },//ACOSTA
  { usuario: '40283167', contraseña: 'intend-2025', foto: '/avatars/', },//JACQUET 
  { usuario: '39719096', contraseña: 'genero-2025', foto: '/avatars/', },//SCHMIDT CLAUDIA 
  { usuario: 'guardia', contraseña: 'guardia-2025', foto: '/avatars/', },//JS

  // ENCARGADOS
  { usuario: '17121821', contraseña: 'oper-2025', foto: '/avatars/', },//RECALDE
  //OPERACIONES
  { usuario: '29634338', contraseña: 'oper-2025', foto: '/avatars/', },//BENITEZ
  { usuario: '29868289', contraseña: 'oper-2025', foto: '/avatars/', },//VELAZQUEZ
  //CNRT
  { usuario: '34361390', contraseña: 'cnrt-2025', foto: '/avatars/', },//GODOY
  //PERSONAL
  { usuario: '28460612', contraseña: 'personal-2025', foto: '/avatars/', },//RODRIGUEZ
  { usuario: '33512937', contraseña: 'personal-2025', foto: '/avatars/', },//CASTILLO
  //MATERIAL
  { usuario: '37393690', contraseña: 'material-2025', foto: '/avatars/', },//LOPEZ
  //INTENDENCIA
  { usuario: '28348269', contraseña: 'intend-2025', foto: '/avatars/', },//TADEO
  //DESPACHO
  { usuario: '26150636', contraseña: 'despacho-2025', foto: '/avatars/', },//MARTINEZ
  //ELECTRONICA
  { usuario: '34465003', contraseña: 'comunic-2025', foto: '/avatars/', },//GAYOSO
  //PAÑOL
  { usuario: '26573351', contraseña: 'pañol-2025', foto: '/avatars/', },//OLIVEIRA
  { usuario: '21473503', contraseña: 'pañol-2025', foto: '/avatars/', },//DIAZ
  //COCINA
  { usuario: '34772716', contraseña: 'cocina-2025', foto: '/avatars/', },//RODRIGUEZ
  //GENERO
  //ARMERIA
  { usuario: '32025868', contraseña: 'armeria-2025', foto: '/avatars/', },//APHALO
  //CREU
  { usuario: '25646141', contraseña: 'creu-2025', foto: '/avatars/', },//TOLOTTI
  //CHOFERES
  { usuario: '25680674', contraseña: 'choferes-2025', foto: '/avatars/', },//PELLEGRINI
  //JURIDICA
  { usuario: '27281218', contraseña: 'jurid-2025', foto: '/avatars/', },//CANTEROS
  //RADIO
  { usuario: '35009035', contraseña: 'radio-2025', foto: '/avatars/', },//AVELLANEDA
  //RADIO
  { usuario: '24645457', contraseña: 'pañol-2025', foto: '/avatars/', },//AGUIRRE
  //INAD
  { usuario: '21950112', contraseña: 'daci-2025', foto: '/avatars/', },//LOTO
  { usuario: '33347808', contraseña: 'daci-2025', foto: '/avatars/', },//FERNANDEZ
  { usuario: '33307812', contraseña: 'genero-2025', foto: '/avatars/', },//RODRIGUEZ
  // SECRETARIA
  { usuario: '41379367', contraseña: 'secretaria-2025', foto: '/avatars/', },//SOSA
  // GUARDIA
  { usuario: '29806826', contraseña: 'guardia-2025', foto: '/avatars/', },//DIAZ, AARON
  { usuario: '32478749', contraseña: 'guardia-2025', foto: '/avatars/', },//OJEDA
];

const LoginControl = () => {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    const usuarioValido = usuariosValidos.find(
      (u) => u.usuario === usuario && u.contraseña === contraseña
    );

    if (usuarioValido) {
      // Usamos claves específicas para el control horario
      localStorage.setItem('control_autenticado', 'true');
      localStorage.setItem(
        'usuario_control',
        JSON.stringify({
          nombre: usuarioValido.usuario, // Guardamos el nombre de usuario
          foto: '/pzrp.png',
        })
      );
      // Redirigir a la página de la que vino o a /control por defecto
      const from = location.state?.from?.pathname || '/control';
      navigate(from, { replace: true });
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    // El JSX es el mismo que tenías, no es necesario cambiarlo
    <>
      <NavBar mostrarAvatar={false} />
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" minHeight="calc(100vh - 64px)">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} p={3} borderRadius={2} boxShadow={3} sx={{ backgroundColor: 'background.paper', width: { xs: '90%', sm: '400px' }, maxWidth: '400px', marginTop: '15vh' }}>
          <Typography variant="h4" fontWeight="bold">Control Horario</Typography>
          <TextField label="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} onKeyDown={handleKeyDown} required fullWidth />
          <TextField label="Contraseña" type="password" value={contraseña} onChange={(e) => setContraseña(e.target.value)} onKeyDown={handleKeyDown} required fullWidth />
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          <Button variant="contained" onClick={handleLogin} fullWidth>Ingresar</Button>
        </Box>
      </Box>
    </>
  );
};

export default LoginControl;