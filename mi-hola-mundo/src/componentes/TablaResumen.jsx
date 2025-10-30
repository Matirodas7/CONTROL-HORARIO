import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { calcularHorasCumplidas } from './Horas';

const TablaResumen = ({ registros, semana }) => {
  const diasSemana = Array.from({ length: 5 }, (_, i) =>
    semana.startOf('isoWeek').add(i, 'day').format('YYYY-MM-DD')
  );

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            {diasSemana.map((dia) => (
              <TableCell key={dia}>{dia}</TableCell>
            ))}
            <TableCell>Total Minutos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {registros.map((r, i) => {
            const totalMinutos = diasSemana.reduce((acc, dia) => {
              const entrada = r[`entrada_${dia}`];
              const salida = r[`salida_${dia}`];
              return acc + calcularHorasCumplidas(entrada, salida);
            }, 0);

            return (
              <TableRow key={i}>
                <TableCell>{r.nombre}</TableCell>
                {diasSemana.map((dia) => (
                  <TableCell key={dia}>
                    {r[`entrada_${dia}`]} - {r[`salida_${dia}`]}
                  </TableCell>
                ))}
                <TableCell>{totalMinutos}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TablaResumen;
