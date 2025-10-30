import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Typography,
} from '@mui/material';

const Tabla = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://172.17.66.106:8000/registros')
      .then(res => res.json())
      .then(data => {
        setRegistros(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando datos:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>Cargando registros...</Typography>
      </div>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ maxWidth: 1000, margin: '2rem auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Usuario Nro.</strong></TableCell>
            <TableCell><strong>Nombre</strong></TableCell>
            <TableCell><strong>Fecha</strong></TableCell>
            <TableCell><strong>Entrada</strong></TableCell>
            <TableCell><strong>Salida</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registros.map((registro, index) => (
            <TableRow key={index}>
              <TableCell>{registro.dni}</TableCell>
              <TableCell>{registro.nombre}</TableCell>
              <TableCell>{registro.fecha}</TableCell>
              <TableCell>{registro.entrada}</TableCell>
              <TableCell>{registro.salida}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default Tabla;
