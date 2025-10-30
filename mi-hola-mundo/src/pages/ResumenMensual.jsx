import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Container, Typography, Table, TableHead, TableBody, TableCell, TableRow,
    TableContainer, Paper, CircularProgress, TextField, Box, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Tooltip, Select,
    InputLabel, FormControl, IconButton, Snackbar, Alert, Grid
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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PrintIcon from '@mui/icons-material/Print';

// Componentes
import PersonalInfoDialog from '../componentes/PersonalInfoDialog';

// --- Configuración de Day.js ---
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(durationPlugin);
dayjs.extend(updateLocale);
dayjs.locale('es');
dayjs.updateLocale('es', { weekStart: 1 });

// --- Constantes ---
const jerarquiaSuperior = ['PM', 'PP', 'PR', 'SP', 'OP', 'OX', 'OA'];
const jerarquiaSubalterno = ['AM', 'AP', 'AI', 'AS', 'AT', 'CI', 'CS', 'MO'];
const mapaOficinas = { '23503471': 'OPERACIONES', '23787036': 'INTENDENCIA', '27800279': 'GENERO', '30275494': 'OPERACIONES', '21739441': 'JURIDICA', '18670736': 'PERSONAL', '30166541': 'GENERO', '31098336': 'OPERACIONES', '34365100': 'GENERO', '37467703': 'PERSONAL', '40189792': 'JURIDICA', '39559921': 'MATERIAL', '35689141': 'PERSONAL', '37474371': 'ABASTECIMIENTO', '40283167': 'INTENDENCIA', '17121821': 'OPERACIONES', '29634338': 'OPERACIONES', '29868289': 'OPERACIONES', '37586910': 'OPERACIONES', '35002440': 'OPERACIONES', '39564456': 'OPERACIONES', '32182659': 'OPERACIONES', '43478717': 'OPERACIONES', '35681329': 'CNRT', '34361390': 'CNRT', '35227445': 'CNRT', '28460612': 'PERSONAL', '33512937': 'PERSONAL', '34465067': 'PERSONAL', '37497791': 'PERSONAL', '28348269': 'INTENDENCIA', '31572733': 'INTENDENCIA', '40207928': 'INTENDENCIA', '40282586': 'INTENDENCIA', '36001665': 'INTENDENCIA', '42290495': 'INTENDENCIA', '41442537': 'INTENDENCIA', '37393690': 'MATERIAL', '45337518': 'MATERIAL', '44435575': 'MATERIAL', '33587937': 'MATERIAL', '25680674': 'CHOFER', '25967837': 'MATERIAL', '27085136': 'CHOFER', '28175857': 'CHOFER', '29571500': 'CHOFER', '32579752': 'CHOFER', '38567564': 'CHOFER', '38310552': 'CHOFER', '27281218': 'JURIDICA', '39134534': 'JURIDICA', '37582199': 'JURIDICA', '38317414': 'JURIDICA', '38896428': 'JURIDICA', '34465003': 'INFORMATICA', '36470296': 'INFORMATICA', '37043371': 'INFORMATICA', '21473503': 'ABASTECIMIENTO', '24645457': 'ABASTECIMIENTO', '26573351': 'ABASTECIMIENTO', '36463992': 'ABASTECIMIENTO', '37468964': 'ABASTECIMIENTO', '26150636': 'DESPACHO', '28084453': 'DESPACHO', '41379367': 'SECRETARIA', '34772716': 'COCINA', '35948829': 'COCINA', '33533114': 'COCINA', '39223517': 'COCINA', '40131873': 'COCINA', '35009035': 'RADIO', '38004640': 'RADIO', '38673880': 'RADIO', '39224882': 'RADIO', '29806826': 'GUARDIA', '32478749': 'GUARDIA', '29640694': 'GUARDIA', '36409433': 'GUARDIA', '39196494': 'GUARDIA', '37585673': 'GUARDIA', '38081489': 'GUARDIA', '25646141': 'CREU', '28077648': 'CREU', '38198984': 'CREU', '38572185': 'CREU', '29674192': 'GENERO', '39306917': 'GENERO', '36843265': 'GENERO', '42169747': 'GENERO', '22895920': 'ARMERIA', '32025868': 'ARMERIA', '30629737': 'ARMERIA', '34895548': 'ARMERIA', '37305341': 'DACI', '42036861': 'DACI', '41320771': 'DACI', '21950112': 'DACI', '33347808': 'DACI', '30616628': 'DACI', '36958772': 'DACI', '37058800': 'DACI', '32727662': 'DACI', '33999092': 'DACI', '35013842': 'DACI', '38879018': 'DACI', '41604001': 'DACI', '42741603': 'DACI', '41981713': 'DACI', '37929790': 'DACI', '33307812': 'GENERO', '39719096': 'GENERO', };
const oficinasUnicas = [...new Set(Object.values(mapaOficinas))].sort();
const HORAS_MENSUALES_ESPERADAS_MINUTOS = (35 * 60 * 4);
const API_BASE_URL = 'http://172.17.66.106:8000';

let datosMaestrosPersonal = {};

function ResumenMensual() {
    // ... (El resto de los estados y hooks se mantienen igual)
    const [registrosTurnos, setRegistrosTurnos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroJerarquia, setFiltroJerarquia] = useState('');
    const [filtroMes, setFiltroMes] = useState(dayjs().startOf('month'));
    const [filtroOficina, setFiltroOficina] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [detalleModalOpen, setDetalleModalOpen] = useState(false);
    const [personaSeleccionadaParaDetalle, setPersonaSeleccionadaParaDetalle] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const navigate = useNavigate();
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);
    const [selectedPersonalInfo, setSelectedPersonalInfo] = useState(null);

    // --- Lógica de fetch y procesamiento de datos (sin cambios, ya es correcta) ---
    const showNotification = useCallback((message, severity = 'success') => { setSnackbarMessage(message); setSnackbarSeverity(severity); setSnackbarOpen(true); }, []);
    const construirDatosMaestros = useCallback((items) => { Object.keys(mapaOficinas).forEach(dni => { if (!datosMaestrosPersonal[dni]) datosMaestrosPersonal[dni] = { nombre: `Personal DNI ${dni}`, jerarquia: 'N/A', oficina: mapaOficinas[dni], fotoUrl: `/fotos_personal/${dni}.jpg` } }); (items || []).forEach(item => { const dni = String(item.dni); if (dni) { if (!datosMaestrosPersonal[dni]) datosMaestrosPersonal[dni] = {}; datosMaestrosPersonal[dni] = { ...datosMaestrosPersonal[dni], nombre: item.nombre || datosMaestrosPersonal[dni].nombre, jerarquia: item.jerarquia || datosMaestrosPersonal[dni].jerarquia, oficina: mapaOficinas[dni] || datosMaestrosPersonal[dni].oficina || 'SIN ASIGNAR', fotoUrl: item.fotoUrl || datosMaestrosPersonal[dni].fotoUrl || `/fotos_personal/${dni}.jpg` }; } }); }, []);
    const fetchTurnosDesdeAPI = useCallback(async () => { try { const res = await fetch(`${API_BASE_URL}/api/turnos`); if (!res.ok) throw new Error(`Error al cargar los turnos: HTTP ${res.status}`); const data = await res.json(); setRegistrosTurnos(data || []); construirDatosMaestros(data || []); } catch (error) { showNotification(error.message, 'error'); setRegistrosTurnos([]); } }, [showNotification, construirDatosMaestros]);
    useEffect(() => { const load = async () => { setLoading(true); await fetchTurnosDesdeAPI(); setLoading(false); }; load(); }, [fetchTurnosDesdeAPI]);

    const datosProcesados = useMemo(() => {
        if (loading) return [];
        const startOfMonth = filtroMes.startOf('month');
        const endOfMonth = filtroMes.endOf('month');
        const datosAgrupados = {};

        Object.keys(datosMaestrosPersonal).forEach(dni => {
            const pM = datosMaestrosPersonal[dni];
            if (!pM) return;
            const nC = !filtroNombre || (pM.nombre && pM.nombre.toLowerCase().includes(filtroNombre.toLowerCase()));
            const pJ = pM.jerarquia ? String(pM.jerarquia).substring(0, 2) : '';
            const jC = !filtroJerarquia || (filtroJerarquia === 'superior' && jerarquiaSuperior.includes(pJ)) || (filtroJerarquia === 'subalterno' && jerarquiaSubalterno.includes(pJ));
            const oC = !filtroOficina || (pM.oficina && pM.oficina === filtroOficina);
            if (nC && jC && oC) { datosAgrupados[dni] = { ...pM, dni: String(dni), dias: {}, totalMinutos: 0, diasTrabajados: 0, tieneTurnoEnMes: false }; }
        });

        const fichajesPorDia = {};
        (registrosTurnos || []).forEach(turno => {
            const dniStr = String(turno.dni);
            if (!datosAgrupados[dniStr]) return;
            const entrada = dayjs(turno.entrada_dt);
            if (!entrada.isValid() || !entrada.isBetween(startOfMonth, endOfMonth, 'day', '[]')) return;
            const fecha = entrada.format('YYYY-MM-DD');
            if (!fichajesPorDia[dniStr]) fichajesPorDia[dniStr] = {};
            if (!fichajesPorDia[dniStr][fecha]) fichajesPorDia[dniStr][fecha] = { fichajes: [] };
            fichajesPorDia[dniStr][fecha].fichajes.push({ entrada, salida: dayjs(turno.salida_dt) });
        });

        Object.keys(fichajesPorDia).forEach(dni => {
            const persona = datosAgrupados[dni];
            if (!persona) return;
            persona.tieneTurnoEnMes = true;
            let totalMinutosMes = 0;
            let diasTrabajados = 0;
            Object.keys(fichajesPorDia[dni]).forEach(fecha => {
                const dataDia = fichajesPorDia[dni][fecha];
                if (dataDia.fichajes.length === 0) return;
                let primeraEntrada = dataDia.fichajes[0].entrada;
                let ultimaSalida = dataDia.fichajes[0].salida;
                dataDia.fichajes.forEach(f => {
                    if (f.entrada.isBefore(primeraEntrada)) primeraEntrada = f.entrada;
                    if (f.salida.isValid() && f.salida.isAfter(ultimaSalida)) ultimaSalida = f.salida;
                });
                let minutosDelDia = 0;
                if (ultimaSalida.isValid() && ultimaSalida.isAfter(primeraEntrada)) {
                    minutosDelDia = ultimaSalida.diff(primeraEntrada, 'minute');
                }
                persona.dias[fecha] = minutosDelDia;
                totalMinutosMes += minutosDelDia;
                if (minutosDelDia > 0) {
                    diasTrabajados++;
                }
            });
            persona.totalMinutos = totalMinutosMes;
            persona.diasTrabajados = diasTrabajados;
            persona.promedioMinutosPorTurno = diasTrabajados > 0 ? totalMinutosMes / diasTrabajados : 0;
        });

        return Object.values(datosAgrupados)
            .filter(p => p.tieneTurnoEnMes)
            .sort((a, b) => (a.nombre || 'Z').localeCompare(b.nombre || 'Z'));

    }, [loading, registrosTurnos, filtroMes, filtroNombre, filtroJerarquia, filtroOficina]);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleSnackbarClose = (_, reason) => { if (reason === 'clickaway') return; setSnackbarOpen(false); };
    const handleMesChange = (e) => { const [y, m] = e.target.value.split('-').map(Number); const d = dayjs().year(y).month(m - 1).startOf('month'); if (d.isValid()) setFiltroMes(d); else showNotification("Mes inválido.", "warning"); };
    const handleOpenInfoWindow = (p) => { setSelectedPersonalInfo(p); setInfoWindowOpen(true); };
    const handleCloseInfoWindow = () => { setInfoWindowOpen(false); setTimeout(() => setSelectedPersonalInfo(null), 150); };
    const formatoHoras = (minutos) => { if (minutos == null || isNaN(minutos) || minutos <= 0) return '-'; const d = dayjs.duration(minutos, 'minutes'); return `${Math.floor(d.asHours())}h ${d.minutes()}m`; };
    const handleVerDetalleDiario = (p) => { setPersonaSeleccionadaParaDetalle(p); setDetalleModalOpen(true); };
    const handleCerrarDetalleModal = () => { setDetalleModalOpen(false); setTimeout(() => setPersonaSeleccionadaParaDetalle(null), 300); };

    const exportarPDFResumen = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`Resumen Mensual: ${filtroMes.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase())}`, 14, 15);
        const head = [['DNI', 'Jerarquía', 'Nombre', 'Días Trab.', 'Total Horas', 'Prom. H/Turno']];
        const body = datosProcesados.map(p => [
            p.dni,
            p.jerarquia,
            p.nombre,
            p.diasTrabajados,
            {
                content: formatoHoras(p.totalMinutos),
                styles: {
                    textColor: p.totalMinutos < HORAS_MENSUALES_ESPERADAS_MINUTOS ? [255, 0, 0] : [0, 100, 0]
                }
            },
            formatoHoras(p.promedioMinutosPorTurno),
        ]);

        autoTable(doc, {
            head: head,
            body: body,
            startY: 22,
            headStyles: { fillColor: '#1765af', textColor: '#FFFFFF', halign: 'center' },
            columnStyles: {
                0: { halign: 'left' }, 1: { halign: 'left' }, 2: { halign: 'left' },
                3: { halign: 'center' }, 4: { halign: 'center', fontStyle: 'bold' }, 5: { halign: 'center' }
            },
            didDrawPage: (data) => {
                doc.setFontSize(10);
                doc.text(`Página ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
        doc.save(`resumen_mensual_${filtroMes.format('YYYY_MM')}.pdf`);
    };

    const DetalleDiarioModal = () => {
        if (!detalleModalOpen || !personaSeleccionadaParaDetalle) return null;

        const exportarPDFDetalle = () => {
            const doc = new jsPDF();
            const persona = personaSeleccionadaParaDetalle;
            const mes = filtroMes.format('MMMM YYYY').replace(/^\w/, c => c.toUpperCase());
            const startX = 14;
            const startY = 38;

            doc.setFontSize(16);
            doc.setTextColor(40);
            doc.text(`Detalle Diario - ${persona.nombre} (DNI: ${persona.dni})`, startX, 20);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(mes, startX, 28);

            const head = [['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']];
            const body = [];
            let currentDay = filtroMes.startOf('month').startOf('week');

            for (let i = 0; i < 6; i++) {
                const weekRow = [];
                for (let j = 0; j < 7; j++) {
                    if (currentDay.isSame(filtroMes, 'month')) {
                        const dateStr = currentDay.format('YYYY-MM-DD');
                        const minutes = persona.dias[dateStr] || 0;
                        const hoursText = minutes > 0 ? formatoHoras(minutes) : '-';
                        weekRow.push({
                            day: currentDay.date().toString(),
                            hours: hoursText
                        });
                    } else {
                        // Para días fuera del mes, pasamos null para identificarlo fácilmente
                        weekRow.push(null);
                    }
                    currentDay = currentDay.add(1, 'day');
                }
                if (weekRow.some(cell => cell !== null)) {
                    body.push(weekRow);
                }
            }

            autoTable(doc, {
                head: head,
                body: body,
                startY: startY,
                theme: 'plain',
                styles: {
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 9,
                    cellPadding: 2,
                    minCellHeight: 14,
                },
                headStyles: {
                    textColor: [60, 60, 60],
                    fontSize: 10,
                    fontStyle: 'normal',
                },
                didParseCell: (data) => {
                    if (data.section === 'body') {
                        const rawData = data.cell.raw;

                        // FIX 1: MANEJO DEL CASO [object Object]
                        // Si la celda es null (día fuera del mes), le decimos que su texto es vacío.
                        if (!rawData) {
                            data.cell.text = [''];
                            return;
                        }

                        // Si la celda tiene datos, procesamos las horas.
                        data.cell.text = [rawData.hours];
                        if (rawData.hours !== '-') {
                            data.cell.styles.textColor = [29, 101, 175]; // Azul
                            // FIX 3: AÑADIR NEGRITA A LAS HORAS
                            data.cell.styles.fontStyle = 'bold';
                        } else {
                            data.cell.styles.textColor = [180, 180, 180];
                        }
                    }
                },
                didDrawCell: (data) => {
                    if (data.section === 'head') {
                        doc.setDrawColor(200, 200, 200);
                        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                    }

                    if (data.section === 'body') {
                        const rawData = data.cell.raw;
                        // Solo dibujamos el número si la celda tiene datos
                        if (rawData && rawData.day) {
                            // FIX 2: CENTRAR EL NÚMERO DEL DÍA
                            const cellMiddleX = data.cell.x + data.cell.width / 2;
                            doc.setFontSize(8);
                            doc.setTextColor(150, 150, 150);
                            // Usamos las opciones de alineación para centrar el texto
                            doc.text(rawData.day, cellMiddleX, data.cell.y + 4, { align: 'center' });
                        }
                    }
                }
            });

            const finalY = doc.lastAutoTable.finalY + 10;
            autoTable(doc, {
                startY: finalY,
                body: [
                    ['Días Trabajados:', persona.diasTrabajados],
                    ['Total Horas Mes:', formatoHoras(persona.totalMinutos)]
                ],
                theme: 'plain',
                styles: { fontSize: 10, cellPadding: 1.5 },
                columnStyles: { 0: { fontStyle: 'bold' } },
            });

            doc.save(`detalle_${persona.dni}_${filtroMes.format('YYYY_MM')}.pdf`);
        };


        const weeksData = [];
        let currentDay = filtroMes.startOf('month').startOf('week');
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                const dateStr = currentDay.format('YYYY-MM-DD');
                const minutes = personaSeleccionadaParaDetalle.dias[dateStr] || 0;
                week.push({ date: currentDay.clone(), minutes, isCurrentMonth: currentDay.isSame(filtroMes, 'month') });
                currentDay = currentDay.add(1, 'day');
            }
            if (week.some(d => d.isCurrentMonth)) {
                weeksData.push(week);
            }
        }

        return (
            <Dialog open={detalleModalOpen} onClose={handleCerrarDetalleModal} maxWidth="md" fullWidth>
                <DialogTitle>
                    Detalle Diario - {personaSeleccionadaParaDetalle.nombre} (DNI: {personaSeleccionadaParaDetalle.dni})
                    <Typography color="text.secondary">{filtroMes.format('MMMM YYYY')}</Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <TableContainer>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>{['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => <TableCell key={d} align="center" sx={{ fontWeight: 'bold' }}>{d}</TableCell>)}</TableRow>
                            </TableHead>
                            <TableBody>
                                {weeksData.map((week, weekIndex) => (
                                    <TableRow key={weekIndex}>
                                        {week.map((day, dayIndex) => (
                                            <TableCell key={dayIndex} align="center" sx={{ border: 1, borderColor: 'divider', height: 80, p: 0.5, bgcolor: day.isCurrentMonth ? 'transparent' : 'grey.100', color: day.isCurrentMonth ? 'text.primary' : 'text.disabled' }}>
                                                <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>{day.date.format('D')}</Typography>
                                                {day.isCurrentMonth && <Typography variant="body2" sx={{ fontWeight: 'bold', color: day.minutes > 0 ? 'primary.main' : 'text.secondary' }}>{formatoHoras(day.minutes)}</Typography>}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={exportarPDFDetalle} color="secondary" startIcon={<PrintIcon />}>Imprimir Detalle</Button>
                    <Button onClick={handleCerrarDetalleModal}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        );
    };

    return (
        <>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 3 }}><Typography variant="h4" component="h1">Resumen Mensual de Asistencia</Typography><Typography variant="body1" color="text.secondary">Consolide las horas trabajadas por el personal durante el mes seleccionado.</Typography></Box>
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Buscar por Nombre" variant="outlined" size="small" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField fullWidth label="Seleccionar Mes" type="month" size="small" InputLabelProps={{ shrink: true }} value={filtroMes.isValid() ? filtroMes.format('YYYY-MM') : ''} onChange={handleMesChange} disabled={loading} />
                        </Grid>
                        <Grid item xs={12} sm={6} md="auto">
                            <Tooltip title="Filtros Adicionales">
                                <Button fullWidth variant="outlined" color="secondary" onClick={handleMenuOpen} startIcon={<FilterListIcon />}>Filtros</Button>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={12} md="auto" sx={{ ml: 'auto' }}>
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Button variant="outlined" color="error" onClick={exportarPDFResumen} startIcon={<PictureAsPdfIcon />} disabled={(loading || datosProcesados.length === 0)}>Exportar Resumen</Button>
                                <Button variant="contained" onClick={() => navigate('/control')}>Volver</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem sx={{ p: 2, minWidth: 240 }}><FormControl fullWidth size="small"><InputLabel>Jerarquía</InputLabel><Select value={filtroJerarquia} onChange={(e) => setFiltroJerarquia(e.target.value)} label="Jerarquía"><MenuItem value="">Todas</MenuItem><MenuItem value="superior">Superior</MenuItem><MenuItem value="subalterno">Subalterno</MenuItem></Select></FormControl></MenuItem>
                    <MenuItem sx={{ p: 2, minWidth: 240 }}><FormControl fullWidth size="small"><InputLabel>Oficina</InputLabel><Select value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} label="Oficina"><MenuItem value="">Todas</MenuItem>{oficinasUnicas.map(oficina => (<MenuItem key={oficina} value={oficina}>{oficina}</MenuItem>))}<MenuItem value="SIN ASIGNAR">SIN ASIGNAR</MenuItem></Select></FormControl></MenuItem>
                </Menu>

                {loading ? (
                    <Box textAlign="center" mt={8}><CircularProgress /><Typography mt={2}>Cargando resumen del mes...</Typography></Box>
                ) : datosProcesados.length > 0 ? (
                    <TableContainer component={Paper}>
                        <Table size="small" stickyHeader sx={{ minWidth: '900px' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper', width: 90 }}>DNI</TableCell>
                                    <TableCell sx={{ position: 'sticky', left: 90, zIndex: 3, bgcolor: 'background.paper', width: 110 }}>Jerarquía</TableCell>
                                    <TableCell sx={{ position: 'sticky', left: 200, zIndex: 3, bgcolor: 'background.paper', width: 220 }}>Nombre</TableCell>
                                    <TableCell align="center">Días Trab.</TableCell>
                                    <TableCell align="center">Total Horas</TableCell>
                                    <TableCell align="center">Prom. H/Turno</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {datosProcesados.map((registro) => (
                                    <TableRow key={registro.dni} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                                        <TableCell component="th" scope="row" sx={{ position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper' }}>{registro.dni}</TableCell>
                                        <TableCell sx={{ position: 'sticky', left: 90, zIndex: 2, bgcolor: 'background.paper' }}>{registro.jerarquia}</TableCell>
                                        <TableCell onClick={() => handleOpenInfoWindow(registro)} sx={{ position: 'sticky', left: 200, zIndex: 2, bgcolor: 'background.paper', cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: 'primary.main' }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{registro.nombre}</TableCell>
                                        <TableCell align="center">{registro.diasTrabajados}</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', color: registro.totalMinutos < HORAS_MENSUALES_ESPERADAS_MINUTOS ? 'error.main' : 'success.main' }}>
                                            {formatoHoras(registro.totalMinutos)}
                                        </TableCell>
                                        <TableCell align="center">{formatoHoras(registro.promedioMinutosPorTurno)}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver detalle diario del mes">
                                                <IconButton color="primary" size="small" onClick={() => handleVerDetalleDiario(registro)}>
                                                    <CalendarMonthIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Paper sx={{ textAlign: 'center', p: 4, mt: 4 }}>
                        <Typography variant="h6">No se encontraron registros</Typography>
                        <Typography color="text.secondary">No hay datos para el mes de {filtroMes.isValid() ? filtroMes.format('MMMM YYYY') : ''} con los filtros aplicados.</Typography>
                    </Paper>
                )}

                <DetalleDiarioModal />
                <PersonalInfoDialog open={infoWindowOpen} onClose={handleCloseInfoWindow} personalInfo={selectedPersonalInfo} />

                <Snackbar open={snackbarOpen} autoHideDuration={5000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} variant="filled" sx={{ width: '100%' }}>{snackbarMessage}</Alert>
                </Snackbar>
            </Container>
        </>
    );
}

export default ResumenMensual;