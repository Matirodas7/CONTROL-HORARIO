import React, { useEffect, useState, useCallback } from 'react';
import {
    Container, Typography, Table, TableHead, TableBody, TableCell, TableRow,
    TableContainer, Paper, CircularProgress, TextField, Box, Button, Menu,
    MenuItem, Tooltip, FormControl, InputLabel, Select, Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/es';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importa los iconos
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FilterListIcon from '@mui/icons-material/FilterList';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import PortraitIcon from '@mui/icons-material/Portrait';

// Importa el componente de diálogo
import PersonalInfoDialog from '../componentes/PersonalInfoDialog';

// Configuración de Day.js
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.locale('es');

// --- Constantes ---
const jerarquiaSuperior = ['PM', 'PP', 'PR', 'SP', 'OP', 'OX', 'OA'];
const jerarquiaSubalterno = ['AM', 'AP', 'AI', 'AS', 'AT', 'CI', 'CS', 'MO'];
const mapaOficinas = {
    '23503471': 'OPERACIONES', '23787036': 'INTENDENCIA', '27800279': 'GENERO',
    '30275494': 'OPERACIONES', '21739441': 'JURIDICA', '18670736': 'PERSONAL',
    '30166541': 'GENERO', '31098336': 'OPERACIONES', '34365100': 'GENERO',
    '37467703': 'PERSONAL', '40189792': 'JURIDICA', '39559921': 'MATERIAL',
    '35689141': 'PERSONAL', '37474371': 'ABASTECIMIENTO', '40283167': 'INTENDENCIA',
    '17121821': 'OPERACIONES', '29634338': 'OPERACIONES', '29868289': 'OPERACIONES',
    '37586910': 'OPERACIONES', '35002440': 'OPERACIONES', '39564456': 'OPERACIONES',
    '32182659': 'OPERACIONES', '43478717': 'OPERACIONES', '35681329': 'CNRT',
    '34361390': 'CNRT', '35227445': 'CNRT', '28460612': 'PERSONAL',
    '33512937': 'PERSONAL', '34465067': 'PERSONAL', '37497791': 'PERSONAL',
    '28348269': 'INTENDENCIA', '31572733': 'INTENDENCIA', '40207928': 'INTENDENCIA',
    '40282586': 'INTENDENCIA', '36001665': 'INTENDENCIA', '42290495': 'INTENDENCIA',
    '41442537': 'INTENDENCIA', '37393690': 'MATERIAL', '45337518': 'MATERIAL',
    '44435575': 'MATERIAL', '33587937': 'MATERIAL', '25680674': 'CHOFER', '25967837': 'MATERIAL',
    '27085136': 'CHOFER', '28175857': 'CHOFER', '29571500': 'CHOFER',
    '32579752': 'CHOFER', '38567564': 'CHOFER', '38310552': 'CHOFER',
    '27281218': 'JURIDICA', '39134534': 'JURIDICA', '37582199': 'JURIDICA',
    '38317414': 'JURIDICA', '38896428': 'JURIDICA', '34465003': 'INFORMATICA',
    '36470296': 'INFORMATICA', '37043371': 'INFORMATICA', '21473503': 'ABASTECIMIENTO',
    '24645457': 'ABASTECIMIENTO', '26573351': 'ABASTECIMIENTO', '36463992': 'ABASTECIMIENTO',
    '36470322': 'ABASTECIMIENTO', '37468964': 'ABASTECIMIENTO', '26150636': 'DESPACHO', '28084453': 'DESPACHO',
    '41379367': 'SECRETARIA', '34772716': 'COCINA', '35948829': 'COCINA',
    '33533114': 'COCINA', '39223517': 'COCINA', '40131873': 'COCINA',
    '35009035': 'RADIO', '38004640': 'RADIO', '38673880': 'RADIO',
    '39224882': 'RADIO', '29806826': 'GUARDIA', '32478749': 'GUARDIA',
    '29640694': 'GUARDIA', '36409433': 'GUARDIA', '39196494': 'GUARDIA',
    '37585673': 'GUARDIA', '25646141': 'CREU', '28077648': 'CREU',
    '38198984': 'CREU', '38572185': 'CREU', '29674192': 'GENERO',
    '39306917': 'GENERO', '36843265': 'GENERO', '42169747': 'GENERO', '39719096': 'GENERO',
    '22895920': 'ARMERIA', '32025868': 'ARMERIA', '30629737': 'ARMERIA', '25660028': 'ARMERIA',
    '34895548': 'ARMERIA', '38879611': 'GCRD', '38081489': 'GCRD', '37580948': 'GCRD',
    '37305341': 'DACI', '42036861': 'DACI', '41320771': 'DACI', '21950112': 'DACI',
    '33347808': 'DACI', '30616628': 'DACI', '36958772': 'DACI', '37058800': 'DACI',
    '32727662': 'DACI', '33999092': 'DACI', '35013842': 'DACI', '38879018': 'DACI',
    '41614001': 'GENERO', '42741603': 'DACI', '41981713': 'DACI', '37929790': 'DACI',
    '33307812': 'GENERO',
}; 
const oficinasUnicas = [...new Set(Object.values(mapaOficinas))].sort();

// --- Componente auxiliar para renderizar las celdas de fichaje ---
const FichajeCell = ({ entrada, salida, sistema }) => {
    if (!entrada) {
        return <TableCell sx={{ textAlign: 'center', color: 'text.disabled' }}>-</TableCell>;
    }
    const Icono = sistema === 'Huella' ? FingerprintIcon : PortraitIcon;
    // Usamos el color 'primary.main' definido en nuestro tema para consistencia
    const color = 'primary.main';

    return (
        <TableCell sx={{ textAlign: 'center', p: 1, minWidth: '120px' }}>
            <Tooltip title={`Sistema de ${sistema}`}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Icono fontSize="small" sx={{ color }} />
                    <Typography variant="body2" sx={{ fontWeight: '500' }}>
                        {dayjs(entrada).format('HH:mm')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                    <Typography variant="body2" sx={{ fontWeight: '500' }}>
                        {salida ? dayjs(salida).format('HH:mm') : '...'}
                    </Typography>
                </Box>
            </Tooltip>
        </TableCell>
    );
};

// --- Componente Principal ---
const RegistroDiario = () => {
    const [registros, setRegistros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroJerarquia, setFiltroJerarquia] = useState('');
    const [filtroOficina, setFiltroOficina] = useState('');
    const [filtroFecha, setFiltroFecha] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
    const [anchorElMenuFiltros, setAnchorElMenuFiltros] = useState(null);
    const [infoWindowOpen, setInfoWindowOpen] = useState(false);
    const [selectedPersonalInfo, setSelectedPersonalInfo] = useState(null);
    const navigate = useNavigate();

    const handleMenuFiltrosOpen = (event) => setAnchorElMenuFiltros(event.currentTarget);
    const handleMenuFiltrosClose = () => setAnchorElMenuFiltros(null);

    const handleOpenInfoWindow = (personalData) => {
        setSelectedPersonalInfo({
            ...personalData,
            fotoUrl: `/fotos_personal/${personalData.dni}.jpg`,
            oficina: mapaOficinas[String(personalData.dni)] || 'SIN ASIGNAR'
        });
        setInfoWindowOpen(true);
    };
    const handleCloseInfoWindow = () => setInfoWindowOpen(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('http://172.17.66.106:8000/registros');
            if (!response.ok) throw new Error('Error en la respuesta de la API');
            const data = await response.json();
            setRegistros(data.map(reg => ({ ...reg, oficina: mapaOficinas[String(reg.dni)] || 'SIN ASIGNAR' })));
        } catch (err) {
            console.error("Error al obtener registros:", err);
            setRegistros([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatoHoras = (horasDecimales) => {
        if (horasDecimales == null || horasDecimales <= 0) return '-';
        const totalMinutos = Math.round(horasDecimales * 60);
        const h = Math.floor(totalMinutos / 60);
        const m = totalMinutos % 60;
        return `${h}h ${m < 10 ? '0' : ''}${m}m`;
    };

    const registrosFiltrados = registros
        .filter((r) => {
            const coincideNombre = r.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
            const coincideFecha = r.fecha === filtroFecha;
            const prefijoJerarquia = r.jerarquia ? r.jerarquia.substring(0, 2) : '';
            const coincideJerarquia = !filtroJerarquia ||
                (filtroJerarquia === 'superior' && jerarquiaSuperior.includes(prefijoJerarquia)) ||
                (filtroJerarquia === 'subalterno' && jerarquiaSubalterno.includes(prefijoJerarquia));
            const coincideOficina = !filtroOficina || (r.oficina === filtroOficina);
            return coincideNombre && coincideJerarquia && coincideFecha && coincideOficina;
        })
        .sort((a, b) => {
            const getPrimeraEntrada = (registro) => {
                const entradaHuella = registro.entrada_huella ? dayjs(registro.entrada_huella) : null;
                const entradaFacial = registro.entrada_facial ? dayjs(registro.entrada_facial) : null;
                if (entradaHuella && entradaFacial) return entradaHuella.isBefore(entradaFacial) ? entradaHuella : entradaFacial;
                return entradaHuella || entradaFacial;
            };
            const primeraEntradaA = getPrimeraEntrada(a);
            const primeraEntradaB = getPrimeraEntrada(b);
            if (!primeraEntradaA) return 1;
            if (!primeraEntradaB) return -1;
            return primeraEntradaA.valueOf() - primeraEntradaB.valueOf();
        });

    const exportarPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`Resumen Diario: ${dayjs(filtroFecha).format('DD/MM/YYYY')}`, 14, 20);

        autoTable(doc, {
            head: [['Jerarquia', 'Nombre', 'Oficina', 'Huella (E-S)', 'Facial (E-S)', 'Total Horas']],
            body: registrosFiltrados.map((r) => [
                r.jerarquia, r.nombre, r.oficina,
                r.entrada_huella ? `${dayjs(r.entrada_huella).format('HH:mm')} - ${r.salida_huella ? dayjs(r.salida_huella).format('HH:mm') : '...'}` : '-',
                r.entrada_facial ? `${dayjs(r.entrada_facial).format('HH:mm')} - ${r.salida_facial ? dayjs(r.salida_facial).format('HH:mm') : '...'}` : '-',
                formatoHoras(r.duracion_horas),
            ]),
            startY: 30,
            headStyles: { fillColor: '#1765af', textColor: '#FFFFFF', halign: 'center' }, // Color del tema
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            columnStyles: { 5: { halign: 'center' } }
        });
        doc.save(`resumen_diario_${filtroFecha}.pdf`);
    };

    return (
        <>
            <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" component="h1">
                        Registro de Asistencia Diario
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Visualice y filtre los registros de entrada y salida del personal.
                    </Typography>
                </Box>

                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField fullWidth label="Buscar por Nombre o DNI" variant="outlined" size="small" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField fullWidth label="Fecha" type="date" size="small" InputLabelProps={{ shrink: true }} value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6} md="auto">
                            <Tooltip title="Filtros Adicionales">
                                <Button fullWidth variant="outlined" color="secondary" onClick={handleMenuFiltrosOpen} startIcon={<FilterListIcon />}>
                                    Filtros
                                </Button>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={12} md="auto" sx={{ ml: 'auto' }}>
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Button variant="outlined" color="error" onClick={exportarPDF} startIcon={<PictureAsPdfIcon />}>
                                    Exportar PDF
                                </Button>
                                <Button variant="contained" onClick={() => navigate('/control')}>
                                    Volver
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                <Menu anchorEl={anchorElMenuFiltros} open={Boolean(anchorElMenuFiltros)} onClose={handleMenuFiltrosClose}>
                    <MenuItem sx={{ p: 2, minWidth: 240, '&:hover': { backgroundColor: 'transparent' } }} disableRipple>
                        <FormControl fullWidth size="small">
                            <InputLabel>Jerarquía</InputLabel>
                            <Select value={filtroJerarquia} onChange={(e) => setFiltroJerarquia(e.target.value)} label="Jerarquía">
                                <MenuItem value="">Todas</MenuItem>
                                <MenuItem value="superior">Superior</MenuItem>
                                <MenuItem value="subalterno">Subalterno</MenuItem>
                            </Select>
                        </FormControl>
                    </MenuItem>
                    <MenuItem sx={{ p: 2, minWidth: 240, '&:hover': { backgroundColor: 'transparent' } }} disableRipple>
                        <FormControl fullWidth size="small">
                            <InputLabel>Oficina</InputLabel>
                            <Select value={filtroOficina} onChange={(e) => setFiltroOficina(e.target.value)} label="Oficina">
                                <MenuItem value="">Todas</MenuItem>
                                {oficinasUnicas.map(oficina => <MenuItem key={oficina} value={oficina}>{oficina}</MenuItem>)}
                                <MenuItem value="SIN ASIGNAR">SIN ASIGNAR</MenuItem>
                            </Select>
                        </FormControl>
                    </MenuItem>
                </Menu>

                {loading ? (
                    <Box textAlign="center" mt={8}><CircularProgress /><Typography mt={2}>Cargando registros...</Typography></Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                {/* El estilo del encabezado ahora viene del tema, no necesita 'sx' */}
                                <TableRow>
                                    <TableCell>DNI</TableCell>
                                    <TableCell>Jerarquía</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Oficina</TableCell>
                                    <TableCell align="center">Horario Huella</TableCell>
                                    <TableCell align="center">Horario Facial</TableCell>
                                    <TableCell align="center">Total Horas</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {registrosFiltrados.length > 0 ? (
                                    registrosFiltrados.map((r) => (
                                        // Estilo para filas alternadas (striped) para mejor legibilidad
                                        <TableRow key={`${r.dni}-${r.fecha}`} hover sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}>
                                            <TableCell>{r.dni}</TableCell>
                                            <TableCell>{r.jerarquia}</TableCell>
                                            <TableCell onClick={() => handleOpenInfoWindow(r)} sx={{ cursor: 'pointer', fontWeight: 500, '&:hover': { color: 'primary.main', textDecoration: 'underline' } }}>
                                                {r.nombre}
                                            </TableCell>
                                            <TableCell>{r.oficina}</TableCell>
                                            <FichajeCell entrada={r.entrada_huella} salida={r.salida_huella} sistema="Huella" />
                                            <FichajeCell entrada={r.entrada_facial} salida={r.salida_facial} sistema="Facial" />
                                            <TableCell sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                                                {formatoHoras(r.duracion_horas)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                            No hay registros para la fecha y filtros seleccionados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
            {selectedPersonalInfo && <PersonalInfoDialog open={infoWindowOpen} onClose={handleCloseInfoWindow} personalInfo={selectedPersonalInfo} />}
        </>
    );
};

export default RegistroDiario;