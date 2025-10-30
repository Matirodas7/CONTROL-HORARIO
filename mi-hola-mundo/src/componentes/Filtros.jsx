import React from 'react';
import { Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import dayjs from 'dayjs';

const Filtros = ({
  filtroNombre,
  setFiltroNombre,
  filtroJerarquia,
  setFiltroJerarquia,
  filtroSemana,
  setFiltroSemana,
  filtroOficina,
  setFiltroOficina
}) => {
  return (
    <Grid container spacing={2} mb={2}>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Nombre"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          label="Jerarquía"
          value={filtroJerarquia}
          onChange={(e) => setFiltroJerarquia(e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          type="week"
          label="Semana"
          value={filtroSemana.format('YYYY-[W]WW')}
          onChange={(e) => setFiltroSemana(dayjs(e.target.value))}
          fullWidth
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <FormControl fullWidth>
          <InputLabel>Oficina</InputLabel>
          <Select
            value={filtroOficina}
            label="Oficina"
            onChange={(e) => setFiltroOficina(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="OPERACIONES">OPERACIONES</MenuItem>
            <MenuItem value="JURIDICA">JURIDICA</MenuItem>
            <MenuItem value="PERSONAL">PERSONAL</MenuItem>
            {/* ...podés cargar dinámicamente más oficinas... */}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default Filtros;
