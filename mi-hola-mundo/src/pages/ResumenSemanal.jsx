import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Container, Typography, Table, TableHead, TableBody, TableCell, TableRow,
  TableContainer, Paper, CircularProgress, TextField, Box, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Tooltip, Select,
  InputLabel, FormControl, IconButton, Snackbar, Alert, Switch, FormControlLabel, Grid
} from '@mui/material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import durationPlugin from 'dayjs/plugin/duration';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/es';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Iconos
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCommentIcon from '@mui/icons-material/AddComment';
import CommentIcon from '@mui/icons-material/Comment';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PortraitIcon from '@mui/icons-material/Portrait';

// Componentes
import PersonalInfoDialog from '../componentes/PersonalInfoDialog';

// --- Dayjs Setup y Constantes ---
dayjs.extend(isBetween); dayjs.extend(utc); dayjs.extend(timezone); dayjs.extend(durationPlugin); dayjs.extend(updateLocale);
dayjs.locale('es');
dayjs.updateLocale('es', { weekStart: 1 });
const jerarquiaSuperior = ['PM', 'PP', 'PR', 'SP', 'OP', 'OX', 'OA'];
const jerarquiaSubalterno = ['AM', 'AP', 'AI', 'AS', 'AT', 'CI', 'CS', 'MO'];
const mapaOficinas = { '23503471': 'OPERACIONES', '23787036': 'INTENDENCIA', '27800279': 'GENERO', '30275494': 'OPERACIONES', '21739441': 'JURIDICA', '18670736': 'PERSONAL', '30166541': 'GENERO', '31098336': 'OPERACIONES', '34365100': 'GENERO', '37467703': 'PERSONAL', '40189792': 'JURIDICA', '39559921': 'MATERIAL', '35689141': 'PERSONAL', '37474371': 'ABASTECIMIENTO', '40283167': 'INTENDENCIA', '17121821': 'OPERACIONES', '29634338': 'OPERACIONES', '29868289': 'OPERACIONES', '37586910': 'OPERACIONES', '35002440': 'OPERACIONES', '39564456': 'OPERACIONES', '32182659': 'OPERACIONES', '43478717': 'OPERACIONES', '35681329': 'CNRT', '34361390': 'CNRT', '35227445': 'CNRT', '28460612': 'PERSONAL', '33512937': 'PERSONAL', '34465067': 'PERSONAL', '37497791': 'PERSONAL', '28348269': 'INTENDENCIA', '31572733': 'INTENDENCIA', '40207928': 'INTENDENCIA', '40282586': 'INTENDENCIA', '36001665': 'INTENDENCIA', '42290495': 'INTENDENCIA', '41442537': 'INTENDENCIA', '37393690': 'MATERIAL', '45337518': 'ABASTECIMIENTO', '44435575': 'MATERIAL', '33587937': 'MATERIAL', '25680674': 'CHOFER', '25967837': 'MATERIAL', '27085136': 'CHOFER', '28175857': 'CHOFER', '29571500': 'CHOFER', '32579752': 'CHOFER', '38567564': 'CHOFER', '38310552': 'CHOFER', '27281218': 'JURIDICA', '39134534': 'JURIDICA', '37582199': 'JURIDICA', '38317414': 'JURIDICA', '38896428': 'JURIDICA', '34465003': 'INFORMATICA', '36470296': 'INFORMATICA', '37043371': 'INFORMATICA', '21473503': 'ABASTECIMIENTO', '24645457': 'ABASTECIMIENTO', '26573351': 'ABASTECIMIENTO', '36463992': 'ABASTECIMIENTO', '38235917': 'ABASTECIMIENTO', '36470322': 'ABASTECIMIENTO', '37468964': 'ABASTECIMIENTO', '26150636': 'DESPACHO', '28084453': 'DESPACHO', '41379367': 'SECRETARIA', '34772716': 'COCINA', '35948829': 'COCINA', '33533114': 'COCINA', '39223517': 'COCINA', '40131873': 'COCina', '35009035': 'RADIO', '38004640': 'RADIO', '38673880': 'RADIO', '39224882': 'RADIO', '29806826': 'GUARDIA', '32478749': 'GUARDIA', '29640694': 'GUARDIA', '36409433': 'GUARDIA', '39196494': 'GUARDIA', '37585673': 'GUARDIA', '25646141': 'CREU', '28077648': 'CREU', '38198984': 'CREU', '38572185': 'CREU', '29674192': 'GENERO', '39306917': 'GENERO', '36843265': 'GENERO', '42169747': 'GENERO', '39719096': 'GENERO', '22895920': 'ARMERIA', '32025868': 'ARMERIA', '30629737': 'ARMERIA', '34895548': 'ARMERIA', '38879611': 'GCRD', '38081489': 'GCRD', '37580948': 'GCRD', '25660028': 'ARMERIA', '37305341': 'DACI', '42036861': 'DACI', '41320771': 'DACI', '21950112': 'DACI', '33347808': 'DACI', '30616628': 'DACI', '36958772': 'DACI', '37058800': 'DACI', '32727662': 'DACI', '33999092': 'DACI', '35013842': 'DACI', '38879018': 'DACI', '41614001': 'GENERO', '42741603': 'DACI', '41981713': 'DACI', '37929790': 'DACI', '33307812': 'GENERO', };
const oficinasUnicas = [...new Set(Object.values(mapaOficinas))].sort();
const HORAS_SEMANALES_ESPERADAS_GENERAL_MINUTOS = 35 * 60;
const HORAS_SEMANALES_ESPERADAS_REDUCIDO_MINUTOS = 30 * 60;
const DNIS_REGIMEN_REDUCIDO = ['41379367', '35689141', '39306917', '36843265', '38572185'];
const COMMENT_CELL_MAX_WIDTH_MM = 80; const COMMENT_CELL_FONT_SIZE = 6;
const API_BASE_URL = 'http://172.17.66.106:8000';

let datosMaestrosPersonal = {};

function ResumenSemanal() {
  const [allTurnos, setAllTurnos] = useState([]);
  const [allComentarios, setAllComentarios] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroJerarquia, setFiltroJerarquia] = useState('');
  const [filtroSemana, setFiltroSemana] = useState(dayjs().startOf('week'));
  const [filtroOficina, setFiltroOficina] = useState('');
  const [filtroPzrp, setFiltroPzrp] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comentarioActual, setComentarioActual] = useState('');
  const [selectedRegistroDni, setSelectedRegistroDni] = useState(null);
  const [selectedComentarioId, setSelectedComentarioId] = useState(null);
  const [selectedFechaComentario, setSelectedFechaComentario] = useState(dayjs());
  const [anchorEl, setAnchorEl] = useState(null);
  const [viewingCommentsData, setViewingCommentsData] = useState({ open: false, comentarios: [], nombre: '', dni: '' });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);
  const [selectedPersonalInfo, setSelectedPersonalInfo] = useState(null);
  const navigate = useNavigate();

  const showNotification = useCallback((message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); }, []);
  const construirDatosMaestros = useCallback((turnos) => { const nuevosDatosMaestros = { ...datosMaestrosPersonal }; (turnos || []).forEach(turno => { const dni = String(turno.dni); if (dni) { const fotoUrl = turno.fotoUrl || `/fotos_personal/${dni}.jpg`; if (!nuevosDatosMaestros[dni]) nuevosDatosMaestros[dni] = {}; nuevosDatosMaestros[dni].nombre = turno.nombre || nuevosDatosMaestros[dni].nombre || `Personal DNI ${dni}`; nuevosDatosMaestros[dni].jerarquia = turno.jerarquia || nuevosDatosMaestros[dni].jerarquia || 'N/A'; nuevosDatosMaestros[dni].oficina = mapaOficinas[dni] || nuevosDatosMaestros[dni].oficina || 'SIN ASIGNAR'; nuevosDatosMaestros[dni].fotoUrl = fotoUrl; } }); Object.keys(mapaOficinas).forEach(dni => { const dniStr = String(dni); const fotoUrl = `/fotos_personal/${dniStr}.jpg`; if (!nuevosDatosMaestros[dniStr]) { nuevosDatosMaestros[dniStr] = { nombre: `Personal DNI ${dniStr}`, jerarquia: 'N/A', oficina: mapaOficinas[dniStr], fotoUrl: fotoUrl }; } else { nuevosDatosMaestros[dniStr].nombre = nuevosDatosMaestros[dniStr].nombre || `Personal DNI ${dniStr}`; nuevosDatosMaestros[dniStr].jerarquia = nuevosDatosMaestros[dniStr].jerarquia || 'N/A'; nuevosDatosMaestros[dniStr].oficina = nuevosDatosMaestros[dniStr].oficina || mapaOficinas[dniStr] || 'SIN ASIGNAR'; nuevosDatosMaestros[dniStr].fotoUrl = nuevosDatosMaestros[dniStr].fotoUrl || fotoUrl; } }); datosMaestrosPersonal = nuevosDatosMaestros; }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [turnosResponse, comentariosResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/turnos`),
        fetch(`${API_BASE_URL}/comentarios`)
      ]);
      if (!turnosResponse.ok) throw new Error(`Error al cargar turnos: HTTP ${turnosResponse.status}`);
      if (!comentariosResponse.ok) throw new Error(`Error al cargar comentarios: HTTP ${comentariosResponse.status}`);
      const turnosData = await turnosResponse.json() || [];
      const comentariosData = await comentariosResponse.json() || [];
      setAllTurnos(turnosData);
      setAllComentarios(comentariosData);
      construirDatosMaestros(turnosData);
    } catch (error) {
      console.error('Error en fetchAllData:', error);
      showNotification(error.message, 'error');
    }
  }, [showNotification, construirDatosMaestros]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoad(true);
      await fetchAllData();
      setIsInitialLoad(false);
    };
    loadInitialData();
  }, [fetchAllData]);

  const recargarDatosDespuesDeModificacion = useCallback(async () => {
    setLoading(true);
    await fetchAllData();
    setLoading(false);
  }, [fetchAllData]);

  const datosFinales = useMemo(() => {
    setLoading(true);

    const startOfWeek = filtroSemana.startOf('week');
    const endOfWeek = filtroSemana.endOf('week');

    const datosAgrupados = {};
    Object.keys(datosMaestrosPersonal).forEach(dni => {
      const pM = datosMaestrosPersonal[dni];
      if (!pM) return;
      const nC = !filtroNombre || (pM.nombre && pM.nombre.toLowerCase().includes(filtroNombre.toLowerCase()));
      const pJ = pM.jerarquia ? String(pM.jerarquia).substring(0, 2) : '';
      const jC = !filtroJerarquia || (filtroJerarquia === 'superior' && jerarquiaSuperior.includes(pJ)) || (filtroJerarquia === 'subalterno' && jerarquiaSubalterno.includes(pJ));
      const oC = !filtroOficina || (pM.oficina && pM.oficina === filtroOficina);
      const pzrpC = !filtroPzrp || (filtroPzrp && pM.oficina !== 'GENERO' && pM.oficina !== 'DACI');

      if (nC && jC && oC && pzrpC) {
        datosAgrupados[dni] = {
          ...pM, dni: String(dni), dias: {}, totalMinutos: 0,
          comentariosSemanales: [], sistemasUsados: new Set(), tieneTurnoEnSemana: false
        };
        Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day').format('YYYY-MM-DD')).forEach(dia => datosAgrupados[dni].dias[dia] = 0);
      }
    });

    // ======================= INICIO DE LA LÓGICA CORREGIDA =======================

    // 1. Agrupar todos los fichajes por DNI y por fecha
    const fichajesPorDia = {};
    allTurnos.forEach(turno => {
      const dniStr = String(turno.dni);
      if (!datosAgrupados[dniStr]) return;

      const entrada = dayjs(turno.entrada_dt);
      if (entrada.isValid() && entrada.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
        datosAgrupados[dniStr].tieneTurnoEnSemana = true;
        if (turno.sistema_fichaje) {
          datosAgrupados[dniStr].sistemasUsados.add(turno.sistema_fichaje);
        }
        const fecha = entrada.format('YYYY-MM-DD');

        if (!fichajesPorDia[dniStr]) {
          fichajesPorDia[dniStr] = {};
        }
        if (!fichajesPorDia[dniStr][fecha]) {
          fichajesPorDia[dniStr][fecha] = [];
        }

        fichajesPorDia[dniStr][fecha].push({
          entrada: entrada,
          salida: dayjs(turno.salida_dt)
        });
      }
    });

    // 2. Calcular la duración real de la jornada (primera entrada a última salida)
    Object.keys(fichajesPorDia).forEach(dni => {
      const persona = datosAgrupados[dni];
      Object.keys(fichajesPorDia[dni]).forEach(fecha => {
        const fichajesDelDia = fichajesPorDia[dni][fecha];
        if (fichajesDelDia.length === 0) return;

        let primeraEntrada = fichajesDelDia[0].entrada;
        let ultimaSalida = dayjs(null); // Iniciar con una fecha inválida

        fichajesDelDia.forEach(f => {
          if (f.entrada.isBefore(primeraEntrada)) {
            primeraEntrada = f.entrada;
          }
          if (f.salida.isValid() && (!ultimaSalida.isValid() || f.salida.isAfter(ultimaSalida))) {
            ultimaSalida = f.salida;
          }
        });

        let minutosDelDia = 0;
        if (primeraEntrada.isValid() && ultimaSalida.isValid() && ultimaSalida.isAfter(primeraEntrada)) {
          minutosDelDia = ultimaSalida.diff(primeraEntrada, 'minute');
        }
        persona.dias[fecha] = minutosDelDia;
      });
    });

    allComentarios.forEach(c => {
      const fC = dayjs(c.fecha_asociada);
      if (fC.isValid() && fC.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
        const dniStr = String(c.registro_dni);
        if (datosAgrupados[dniStr] && !datosAgrupados[dniStr].comentariosSemanales.find(co => co.id === c.id)) {
          datosAgrupados[dniStr].comentariosSemanales.push({ ...c, registro_dni: dniStr });
        }
      }
    });

    Object.values(datosAgrupados).forEach(persona => {
      persona.totalMinutos = Object.values(persona.dias).reduce((acc, curr) => acc + curr, 0);
    });

    const resultado = Object.values(datosAgrupados)
      .filter(p => p.tieneTurnoEnSemana || p.comentariosSemanales.length > 0)
      .map(p => {
        p.comentariosSemanales.sort((a, b) => dayjs(a.fecha_asociada).valueOf() - dayjs(b.fecha_asociada).valueOf());
        p.sistemasUsados = Array.from(p.sistemasUsados);
        return p;
      })
      .sort((a, b) => (a.nombre || 'Z').localeCompare(b.nombre || 'Z'));

    setTimeout(() => setLoading(false), 10);
    return resultado;

  }, [allTurnos, allComentarios, filtroSemana, filtroNombre, filtroJerarquia, filtroOficina, filtroPzrp]);

  const handleGuardarComentario = async () => {
    const comentarioTrimmed = comentarioActual.trim();
    if (!comentarioTrimmed) { showNotification("El comentario no puede estar vacío.", "warning"); return; }
    if (!selectedRegistroDni || !selectedFechaComentario?.isValid()) { showNotification("Datos del comentario inválidos.", "error"); return; }

    const isEditing = !!selectedComentarioId;
    const url = isEditing ? `${API_BASE_URL}/comentarios/${selectedComentarioId}` : `${API_BASE_URL}/comentarios`;
    const method = isEditing ? 'PUT' : 'POST';
    const body = JSON.stringify(isEditing ? { comentario: comentarioTrimmed } : {
      registro_dni: String(selectedRegistroDni),
      registro_entrada_fecha: selectedFechaComentario.format('YYYY-MM-DD'),
      comentario: comentarioTrimmed
    });

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Error ${response.status}` }));
        throw new Error(errorData.detail || 'Error desconocido.');
      }
      const result = await response.json();
      showNotification(result.message || (isEditing ? "Comentario actualizado" : "Comentario agregado"), "success");
      handleDialogClose();
      await recargarDatosDespuesDeModificacion();
    } catch (error) {
      console.error(`Error:`, error);
      showNotification(`Error: ${error.message}`, "error");
    }
  };

  const handleEliminarComentario = async (comentarioIdToDelete, dniDelComentario) => {
    if (!comentarioIdToDelete || !window.confirm("¿Eliminar este comentario?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/comentarios/${comentarioIdToDelete}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido.' }));
        throw new Error(errorData.detail || 'Fallo al eliminar.');
      }
      showNotification("Comentario eliminado.", "warning");
      if (viewingCommentsData.open) handleCloseViewCommentsDialog();
      await recargarDatosDespuesDeModificacion();
    } catch (error) {
      console.error('Error:', error);
      showNotification(`Error: ${error.message}`, "error");
    }
  };

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleSnackbarClose = (_, reason) => { if (reason === 'clickaway') return; setSnackbarOpen(false); };
  const handleFechaChange = (e) => { const d = dayjs(e.target.value); if (d.isValid()) setFiltroSemana(d.startOf('week')); else showNotification("Fecha inválida.", "warning"); };

  const handleDialogOpen = (comentarioData = null, registroDniParaNuevo = null, fechaPorDefectoDialogo = null) => {
    setDialogOpen(true);
    if (comentarioData?.id) {
      setSelectedComentarioId(comentarioData.id);
      setComentarioActual(comentarioData.comentario);
      setSelectedRegistroDni(String(comentarioData.registro_dni));
      const fechaAsociada = dayjs(comentarioData.fecha_asociada);
      setSelectedFechaComentario(fechaAsociada.isValid() ? fechaAsociada : dayjs());
    } else {
      setComentarioActual('');
      setSelectedComentarioId(null);
      setSelectedRegistroDni(String(registroDniParaNuevo));
      const fechaInicial = fechaPorDefectoDialogo ? dayjs(fechaPorDefectoDialogo) : dayjs();
      setSelectedFechaComentario(fechaInicial.isValid() ? fechaInicial : dayjs());
    }
  };

  const handleDialogClose = () => { setDialogOpen(false); setTimeout(() => { setComentarioActual(''); setSelectedComentarioId(null); setSelectedRegistroDni(null); setSelectedFechaComentario(dayjs()); }, 150); };
  const formatoHoras = (minutos) => { if (minutos == null || isNaN(minutos) || minutos <= 0) return '-'; const d = dayjs.duration(minutos, 'minutes'); return `${Math.floor(d.asHours())}h ${d.minutes()}m`; };
  const handleOpenViewCommentsDialog = (r) => setViewingCommentsData({ open: true, comentarios: r.comentariosSemanales, nombre: r.nombre, dni: r.dni });
  const handleCloseViewCommentsDialog = () => setViewingCommentsData({ open: false, comentarios: [], nombre: '', dni: '' });
  const handleOpenInfoWindow = (personalData) => { setSelectedPersonalInfo(personalData); setInfoWindowOpen(true); };
  const handleCloseInfoWindow = () => { setInfoWindowOpen(false); setTimeout(() => setSelectedPersonalInfo(null), 150); };

  const startOfWeek = filtroSemana.startOf('week');
  const endOfWeek = filtroSemana.endOf('week');
  const diasSemana = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const inicio = startOfWeek.format('DD/MM/YYYY');
    const fin = endOfWeek.format('DD/MM/YYYY');
    let titulo = `Resumen Semanal: ${inicio} al ${fin}`;
    if (filtroOficina) titulo += ` - Oficina: ${filtroOficina}`;
    if (filtroJerarquia) titulo += ` - Jerarquía: ${filtroJerarquia.charAt(0).toUpperCase() + filtroJerarquia.slice(1)}`;
    if (filtroPzrp) titulo += ` - (Filtro PZRP activo)`;

    doc.setFontSize(14);
    doc.text(titulo, 14, 15);

    const head = [[
      { content: 'DNI' }, { content: 'Jerarquía' }, { content: 'Nombre' }, { content: 'Oficina' },
      ...diasSemana.map((dia) => ({ content: dia.format('ddd DD').replace(/^\w/, c => c.toUpperCase()) })),
      { content: 'Total H.' }, { content: 'Comentarios' },
    ]];

    const body = datosFinales.map((p) => {
      const esRegimenReducido = DNIS_REGIMEN_REDUCIDO.includes(p.dni);
      const horasEsperadas = esRegimenReducido ? HORAS_SEMANALES_ESPERADAS_REDUCIDO_MINUTOS : HORAS_SEMANALES_ESPERADAS_GENERAL_MINUTOS;
      let colorTotalHoras = p.tieneTurnoEnSemana ? (p.totalMinutos < horasEsperadas ? [255, 0, 0] : [0, 100, 0]) : [0, 0, 0];
      const comentariosProcesados = (p.comentariosSemanales || []).map(c => `(${dayjs(c.fecha_asociada).format('DD/MM')}) ${c.comentario}`).join('\n--\n');

      return [
        p.dni, p.jerarquia, p.nombre, p.oficina,
        ...diasSemana.map((d) => formatoHoras(p.dias[d.format('YYYY-MM-DD')])),
        { content: formatoHoras(p.totalMinutos), styles: { textColor: colorTotalHoras, fontStyle: 'bold' } },
        { content: comentariosProcesados, styles: { fontStyle: 'italic', fontSize: COMMENT_CELL_FONT_SIZE } },
      ];
    });

    autoTable(doc, {
      head, body, startY: 22, theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak', valign: 'middle', halign: 'center' },
      headStyles: { fillColor: '#1765af', textColor: '#FFFFFF', fontStyle: 'bold' },
      columnStyles: {
        2: { halign: 'left' }, 3: { halign: 'left' },
        12: { cellWidth: COMMENT_CELL_MAX_WIDTH_MM, halign: 'left' }
      },
      margin: { left: 14, right: 14 }
    });
    doc.save(`resumen_semanal_${startOfWeek.format('YYYYMMDD')}.pdf`);
  };

  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">Resumen Semanal de Asistencia</Typography>
          <Typography variant="body1" color="text.secondary">Analice el total de horas semanales del personal y gestione los comentarios.</Typography>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}><TextField fullWidth label="Buscar por Nombre" variant="outlined" size="small" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} /></Grid>
            <Grid item xs={12} sm={6} md={3}><TextField fullWidth label="Seleccionar Semana" type="date" size="small" InputLabelProps={{ shrink: true }} value={filtroSemana.format('YYYY-MM-DD')} onChange={handleFechaChange} disabled={isInitialLoad} /></Grid>
            <Grid item xs={12} sm={6} md="auto"><Tooltip title="Filtros Adicionales"><Button fullWidth variant="outlined" color="secondary" onClick={handleMenuOpen} startIcon={<FilterListIcon />}>Filtros</Button></Tooltip></Grid>
            <Grid item xs={12} md="auto" sx={{ ml: 'auto' }}>
              <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PictureAsPdfIcon />} disabled={(isInitialLoad || datosFinales.length === 0)}>Exportar PDF</Button>
                <Button variant="contained" onClick={() => navigate('/control')}>Volver</Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem sx={{ p: 2, minWidth: 240 }}><FormControl fullWidth size="small"><InputLabel>Jerarquía</InputLabel><Select value={filtroJerarquia} onChange={(e) => setFiltroJerarquia(e.target.value)} label="Jerarquía"><MenuItem value="">Todas</MenuItem><MenuItem value="superior">Superior</MenuItem><MenuItem value="subalterno">Subalterno</MenuItem></Select></FormControl></MenuItem>
          <MenuItem sx={{ p: 2, minWidth: 240 }}><FormControl fullWidth size="small"><InputLabel>Oficina</InputLabel><Select value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} label="Oficina"><MenuItem value="">Todas</MenuItem>{oficinasUnicas.map(oficina => (<MenuItem key={oficina} value={oficina}>{oficina}</MenuItem>))}<MenuItem value="SIN ASIGNAR">SIN ASIGNAR</MenuItem></Select></FormControl></MenuItem>
          <MenuItem onClick={(e) => e.stopPropagation()} sx={{ p: 1, minWidth: 220, justifyContent: 'center' }}><FormControlLabel control={<Switch checked={filtroPzrp} onChange={(e) => setFiltroPzrp(e.target.checked)} />} label="Filtro PZRP" sx={{ pl: 1, pr: 1 }} /></MenuItem>
        </Menu>

        {isInitialLoad ? (
          <Box textAlign="center" mt={8}><CircularProgress /><Typography mt={2}>Cargando datos maestros por primera vez...</Typography></Box>
        ) : loading ? (
          <Box textAlign="center" mt={8}><CircularProgress size={30} /><Typography mt={1}>Procesando semana...</Typography></Box>
        ) : datosFinales.length > 0 ? (
          <TableContainer component={Paper}>
            <Table size="small" stickyHeader sx={{ minWidth: '1200px' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, width: 90 }}>DNI</TableCell>
                  <TableCell sx={{ position: 'sticky', left: 90, zIndex: 3, width: 110 }}>Jerarquía</TableCell>
                  <TableCell sx={{ position: 'sticky', left: 200, zIndex: 3, width: 220 }}>Nombre</TableCell>
                  <TableCell sx={{ position: 'sticky', left: 420, zIndex: 3, width: 140 }}>Oficina</TableCell>
                  {diasSemana.map((dia) => (<TableCell align="center" key={dia.format('YYYY-MM-DD')}>{dia.format('ddd DD')}</TableCell>))}
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Comentarios</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFinales.map((registro) => {
                  const esReducido = DNIS_REGIMEN_REDUCIDO.includes(String(registro.dni));
                  const horasEsp = esReducido ? HORAS_SEMANALES_ESPERADAS_REDUCIDO_MINUTOS : HORAS_SEMANALES_ESPERADAS_GENERAL_MINUTOS;
                  let colorTotal = 'text.primary';
                  if (registro.tieneTurnoEnSemana) colorTotal = registro.totalMinutos < horasEsp ? 'error.main' : 'success.main';

                  return (
                    <TableRow key={registro.dni} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                      <TableCell component="th" scope="row" sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper', width: 90 }}>{registro.dni}</TableCell>
                      <TableCell sx={{ position: 'sticky', left: 90, zIndex: 2, bgcolor: 'background.paper', width: 110 }}>{registro.jerarquia}</TableCell>
                      <TableCell onClick={() => handleOpenInfoWindow(registro)} sx={{ position: 'sticky', left: 200, zIndex: 2, bgcolor: 'background.paper', cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: 'primary.main' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: 220, maxWidth: 220 }}>{registro.nombre}</TableCell>
                      <TableCell sx={{ position: 'sticky', left: 420, zIndex: 2, bgcolor: 'background.paper', width: 140 }}>{registro.oficina}</TableCell>
                      {diasSemana.map((dia) => (<TableCell key={dia.format('YYYY-MM-DD')} align="center">{formatoHoras(registro.dias[dia.format('YYYY-MM-DD')])}</TableCell>))}
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: colorTotal }}>{formatoHoras(registro.totalMinutos)}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, height: '20px' }}>
                            {registro.sistemasUsados.includes('Huella') && (<Tooltip title="Usó sistema de Huella"><FingerprintIcon fontSize="small" color="primary" /></Tooltip>)}
                            {registro.sistemasUsados.includes('Facial') && (<Tooltip title="Usó sistema Facial"><PortraitIcon fontSize="small" color="secondary" /></Tooltip>)}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Agregar comentario"><span><IconButton color="primary" size="small" onClick={() => handleDialogOpen(null, registro.dni, filtroSemana.format('YYYY-MM-DD'))}><AddCommentIcon /></IconButton></span></Tooltip>
                        {registro.comentariosSemanales?.length > 0 && (<Tooltip title="Ver/Editar comentarios"><IconButton color="secondary" size="small" onClick={() => handleOpenViewCommentsDialog(registro)}><CommentIcon /></IconButton></Tooltip>)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper sx={{ textAlign: 'center', p: 4, mt: 4 }}>
            <Typography variant="h6">No se encontraron registros</Typography>
            <Typography color="text.secondary">No hay datos de asistencia para la semana del {startOfWeek.format('DD/MM/YYYY')} al {endOfWeek.format('DD/MM/YYYY')} con los filtros aplicados.</Typography>
          </Paper>
        )}

        <PersonalInfoDialog open={infoWindowOpen} onClose={handleCloseInfoWindow} personalInfo={selectedPersonalInfo} />

        <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedComentarioId ? 'Editar Comentario' : 'Agregar Comentario'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>{selectedRegistroDni ? `DNI: ${selectedRegistroDni}` : 'DNI no especificado'}{selectedRegistroDni && datosMaestrosPersonal[selectedRegistroDni] ? ` - ${datosMaestrosPersonal[selectedRegistroDni].nombre}` : ''}</Typography>
            <TextField label="Fecha asociada al comentario" type="date" value={selectedFechaComentario.isValid() ? selectedFechaComentario.format('YYYY-MM-DD') : ''} onChange={(e) => { const d = dayjs(e.target.value); if (d.isValid()) setSelectedFechaComentario(d); }} fullWidth margin="dense" InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} inputProps={{ min: startOfWeek.format('YYYY-MM-DD'), max: endOfWeek.format('YYYY-MM-DD') }} />
            <TextField autoFocus margin="dense" label="Comentario" type="text" fullWidth multiline rows={4} value={comentarioActual} onChange={(e) => setComentarioActual(e.target.value)} />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}><Button onClick={handleDialogClose}>Cancelar</Button><Button onClick={handleGuardarComentario} variant="contained" color="primary" disabled={loading}>{loading ? <CircularProgress size={24} color="inherit" /> : (selectedComentarioId ? 'Actualizar' : 'Guardar')}</Button></DialogActions>
        </Dialog>

        <Dialog open={viewingCommentsData.open} onClose={handleCloseViewCommentsDialog} maxWidth="md" fullWidth scroll="paper">
          <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>Comentarios: {viewingCommentsData.nombre} (DNI: {viewingCommentsData.dni})<Typography variant="caption" display="block" color="text.secondary">Semana del {startOfWeek.format('DD/MM/YYYY')} al {endOfWeek.format('DD/MM/YYYY')}</Typography></DialogTitle>
          <DialogContent dividers sx={{ p: (viewingCommentsData.comentarios?.length ?? 0) > 0 ? 2 : 0, bgcolor: 'grey.100' }}>
            {(viewingCommentsData.comentarios?.length ?? 0) > 0 ? (
              viewingCommentsData.comentarios.map((comentario) => (
                <Paper key={comentario.id} elevation={2} sx={{ p: 2, mb: 2, '&:hover': { boxShadow: 6 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>Referente al día: <strong>{dayjs(comentario.fecha_asociada).format('dddd DD/MM/YYYY')}</strong></Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Agregado/Editado: {dayjs(comentario.fecha_creacion).format('DD/MM/YY HH:mm')}</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comentario.comentario}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: 'center', flexShrink: 0, ml: { sm: 1 } }}>
                      <Tooltip title="Editar comentario"><span><IconButton size="small" onClick={() => { handleCloseViewCommentsDialog(); handleDialogOpen(comentario, comentario.registro_dni, comentario.fecha_asociada); }} disabled={loading}><EditIcon fontSize="small" /></IconButton></span></Tooltip>
                      <Tooltip title="Eliminar comentario"><span><IconButton size="small" color="error" onClick={() => handleEliminarComentario(comentario.id, comentario.registro_dni)} disabled={loading}><DeleteIcon fontSize="small" /></IconButton></span></Tooltip>
                    </Box>
                  </Box>
                </Paper>
              ))
            ) : (<Box sx={{ p: 3, textAlign: 'center' }}><Typography>No hay comentarios.</Typography></Box>)}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}><Button onClick={handleCloseViewCommentsDialog} color="primary" variant="outlined">Cerrar</Button></DialogActions>
        </Dialog>

        <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>{snackbarMessage}</Alert>
        </Snackbar>
      </Container>
    </>
  );
}

export default ResumenSemanal;