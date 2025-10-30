import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Container, Typography, Box, Paper, Tabs, Tab, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, TextField, Autocomplete, IconButton, Switch, Tooltip, Menu, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Snackbar
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, getDaysInMonth, setDate } from 'date-fns';
import { Edit, Delete, Add, Settings, FileDownload, Save, WarningAmber } from '@mui/icons-material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NumerosALetras } from 'numero-a-letras';
import AttachMoneyOutlinedIcon from '@mui/icons-material/AttachMoneyOutlined';

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://172.17.66.106:8000';

// --- DEFINICIONES GLOBALES ---
const jerarquiasSuperiores = ['PM', 'PP', 'PR', 'SP', 'OP', 'OX', 'OA'];
const jerarquiasSubalternos = ['AM', 'AP', 'AI', 'AS', 'AT', 'CI', 'CS', 'MO'];
// CAMBIO 3 (Relacionado): El rankOrder ya estaba bien definido, lo usaremos para el ordenamiento del PDF.
const rankOrder = [...jerarquiasSuperiores, ...jerarquiasSubalternos].reduce((acc, rank, index) => { acc[rank] = index; return acc; }, {});

// --- COMPONENTE REUTILIZABLE: DIÁLOGO DE CONFIRMACIÓN ---
function ConfirmDialog({ open, onClose, onConfirm, title, children }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningAmber sx={{ mr: 1, color: 'warning.main' }} />
                {title}
            </DialogTitle>
            <DialogContent>{children}</DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={onConfirm} color="error" variant="contained">Confirmar</Button>
            </DialogActions>
        </Dialog>
    );
}

// --- SUB-COMPONENTE: DIÁLOGO DE CONFIGURACIÓN DE PRECIOS ---
function SettingsDialog({ open, onClose, settings, onSave }) {
    const [localSettings, setLocalSettings] = useState(settings);
    useEffect(() => { setLocalSettings(settings); }, [settings, open]);
    const handleSave = () => { onSave(localSettings); };
    const handleChange = (key, value) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setLocalSettings(prev => ({ ...prev, [key]: value }));
        }
    };
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Configurar Precios</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important', width: 400 }}>
                <TextField label="Precio Ración (Base)" type="number" value={localSettings.precio_gamela_simple || ''} onChange={(e) => handleChange('precio_gamela_simple', e.target.value)} helperText="Valor por cada ración/comida de diferencia." />
                <TextField label="Precio Gamela (si no racionó)" type="number" value={localSettings.precio_gamela_total || ''} onChange={(e) => handleChange('precio_gamela_total', e.target.value)} helperText="Costo total si comió y no tenía raciones." />
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Cancelar</Button><Button onClick={handleSave} variant="contained" startIcon={<Save />}>Guardar</Button></DialogActions>
        </Dialog>
    );
}

// --- SUB-COMPONENTE: VISTA DE GESTIÓN DE RACIONAMIENTO ---
function RationingView({ activePersonnel, settings }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [personnelInTable, setPersonnelInTable] = useState([]);
    const [dailyRecords, setDailyRecords] = useState({});
    const [changesToSave, setChangesToSave] = useState({});
    const [anchorEl, setAnchorEl] = useState(null);
    const [autocompleteKey, setAutocompleteKey] = useState(0);
    const [loadingDate, setLoadingDate] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [confirmInfo, setConfirmInfo] = useState({ open: false, person: null });

    const RATION_PRICE = parseFloat(settings.precio_gamela_simple || 0);
    const MEAL_COST_TOTAL = parseFloat(settings.precio_gamela_total || 0);

    const fetchDailyData = useCallback(async (date) => {
        setLoadingDate(true); setChangesToSave({});
        const dateStr = format(date, 'yyyy-MM-dd');
        const url = `${API_BASE_URL}/api/daily_roster?date=${dateStr}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch daily roster');
            const rosterData = await response.json();
            const peopleWithLogs = rosterData.filter(p => p.log !== null);
            const newDailyRecords = {};
            peopleWithLogs.forEach(p => { newDailyRecords[p.dni] = { raciones: p.log.cantidad_raciones || 0, comidas: p.log.cantidad_comidas || 0 }; });
            const personnelMap = new Map(activePersonnel.map(p => [p.dni, p]));
            // Se mantiene el orden por apellido por defecto al cargar la tabla
            const personnelToShow = peopleWithLogs.map(p => personnelMap.get(p.dni)).filter(Boolean).sort((a, b) => a.apellido.localeCompare(b.apellido));
            setPersonnelInTable(personnelToShow);
            setDailyRecords(newDailyRecords);
        } catch (error) { setSnackbar({ open: true, message: `Error al cargar datos: ${error.message}`, severity: 'error' }); }
        finally { setLoadingDate(false); setAutocompleteKey(prev => prev + 1); }
    }, [activePersonnel]);

    useEffect(() => { fetchDailyData(selectedDate); }, [selectedDate, fetchDailyData]);

    const handleToggle = (dni, type, value) => {
        const currentRecord = dailyRecords[dni] || { raciones: 0, comidas: 0 };
        const newValue = currentRecord[type] === value ? 0 : value;
        const newRecord = { ...currentRecord, [type]: newValue };
        setDailyRecords(prev => ({ ...prev, [dni]: newRecord }));
        setChangesToSave(prev => ({ ...prev, [dni]: newRecord }));
    };

    const handleAddPersonToTable = (person) => {
        if (person && !personnelInTable.some(p => p.dni === person.dni)) {
            // CAMBIO 2: Se añade el nuevo personal al PRINCIPIO del array en lugar del final.
            const newTable = [person, ...personnelInTable];
            setPersonnelInTable(newTable);
            setDailyRecords(prev => ({ ...prev, [person.dni]: { raciones: 0, comidas: 0 } }));
            setChangesToSave(prev => ({ ...prev, [person.dni]: { raciones: 0, comidas: 0 } }));
            setAutocompleteKey(prev => prev + 1);
        }
    };

    const handleOpenConfirmDialog = (person) => setConfirmInfo({ open: true, person });
    const handleCloseConfirmDialog = () => setConfirmInfo({ open: false, person: null });

    const handleConfirmRemove = () => {
        if (!confirmInfo.person) return;
        const dni = confirmInfo.person.dni;
        setPersonnelInTable(prev => prev.filter(p => p.dni !== dni));
        setDailyRecords(prev => ({ ...prev, [dni]: { raciones: 0, comidas: 0 } }));
        setChangesToSave(prev => ({ ...prev, [dni]: { raciones: 0, comidas: 0 } }));
        handleCloseConfirmDialog();
        setSnackbar({ open: true, message: 'Registro eliminado con éxito.', severity: 'success' });
    };

    const handleSaveChanges = async () => {
        const promises = Object.entries(changesToSave).map(([dni, record]) => fetch(`${API_BASE_URL}/api/update_ration_day`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ personnel_dni: dni, fecha: format(selectedDate, 'yyyy-MM-dd'), cantidad_raciones: record.raciones, cantidad_comidas: record.comidas }) }));
        try {
            await Promise.all(promises);
            setSnackbar({ open: true, message: 'Cambios guardados con éxito.', severity: 'success' });
            fetchDailyData(selectedDate);
        } catch (error) { setSnackbar({ open: true, message: 'Error al guardar.', severity: 'error' }); }
    };

    const handleExportPDF = async (reportType) => {
        setAnchorEl(null);
        const generateDetailedReport = async (startDate, endDate, reportTitle, fileNameSuffix) => {
            const allLogsUrl = `${API_BASE_URL}/api/rations?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`;
            const allLogsInRange = await (await fetch(allLogsUrl)).json();
            const logsByPerson = allLogsInRange.reduce((acc, log) => { (acc[log.personnel_dni] = acc[log.personnel_dni] || []).push(log); return acc; }, {});
            const personnelData = activePersonnel
                .map(person => {
                    const personLogs = logsByPerson[person.dni] || [];
                    if (personLogs.length === 0) return null;
                    const cant_rac = personLogs.reduce((sum, log) => sum + (log.cantidad_raciones || 0), 0);
                    const imp_total_rac = cant_rac * RATION_PRICE;
                    const cant_gamela = personLogs.reduce((sum, log) => sum + (log.cantidad_comidas || 0), 0);
                    const imp_total_gamela = personLogs.reduce((sum, log) => {
                        const comidas = log.cantidad_comidas || 0; const raciones = log.cantidad_raciones || 0;
                        if (comidas > 0) {
                            if (raciones === 0) return sum + (comidas * MEAL_COST_TOTAL);
                            return sum + (comidas * RATION_PRICE);
                        } return sum;
                    }, 0);
                    const balance = imp_total_rac - imp_total_gamela;
                    return { person, jerarquiaCorta: (person.jerarquia || '').substring(0, 2).toUpperCase(), cant_rac, imp_total_rac, cant_gamela, imp_total_gamela, deposito: balance > 0 ? balance : 0, paga: balance < 0 ? balance : 0 };
                })
                .filter(Boolean)
                // CAMBIO 3: Ordenamiento por jerarquía y luego por DNI.
                .sort((a, b) => {
                    const rankA = rankOrder[a.jerarquiaCorta] ?? 99;
                    const rankB = rankOrder[b.jerarquiaCorta] ?? 99;
                    if (rankA !== rankB) {
                        return rankA - rankB;
                    }
                    return parseInt(a.person.dni, 10) - parseInt(b.person.dni, 10);
                });

            if (personnelData.length === 0) { alert("No hay datos para generar el reporte detallado."); return; }
            const doc = new jsPDF({ orientation: 'landscape', format: 'legal' });
            autoTable(doc, { body: [['PREFECTURA DE ZONA RIO DE LA PLATA'], ['AUTORIDAD MARITIMA'], [reportTitle.replace('DE REFRIGERIO', 'DETALLADA DE REFRIGERIO')], [`Período del ${format(startDate, 'dd')} al ${format(endDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}`]], theme: 'plain', styles: { halign: 'left', fontSize: 10, fontStyle: 'bold' }, margin: { left: 14 } });
            const head = [['JR', 'D.N.I.', 'APELLIDO Y NOMBRE', 'IMP. UNIT.', 'CANT. RAC.', 'IMP. TOTAL', 'CANT. GAMELA', 'IMP. TOTAL', 'DEPOSITO', 'PAGA']];
            const body = personnelData.map(item => [item.jerarquiaCorta, item.person.dni, `${item.person.apellido}, ${item.person.nombre}`, RATION_PRICE > 0 ? RATION_PRICE.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '', item.cant_rac > 0 ? item.cant_rac : '', item.imp_total_rac > 0 ? item.imp_total_rac.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '', item.cant_gamela > 0 ? item.cant_gamela : '', item.imp_total_gamela > 0 ? item.imp_total_gamela.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '', item.deposito > 0 ? item.deposito.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '', item.paga < 0 ? item.paga.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '']);
            const totalRow = { cant_rac: personnelData.reduce((sum, item) => sum + item.cant_rac, 0), imp_total_rac: personnelData.reduce((sum, item) => sum + item.imp_total_rac, 0), cant_gamela: personnelData.reduce((sum, item) => sum + item.cant_gamela, 0), imp_total_gamela: personnelData.reduce((sum, item) => sum + item.imp_total_gamela, 0), deposito: personnelData.reduce((sum, item) => sum + item.deposito, 0), paga: personnelData.reduce((sum, item) => sum + item.paga, 0) };
            body.push([{ content: 'TOTALES', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: RATION_PRICE > 0 ? RATION_PRICE.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '', styles: { fontStyle: 'bold' } }, { content: totalRow.cant_rac, styles: { fontStyle: 'bold' } }, { content: totalRow.imp_total_rac.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), styles: { fontStyle: 'bold' } }, { content: totalRow.cant_gamela, styles: { fontStyle: 'bold' } }, { content: totalRow.imp_total_gamela.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), styles: { fontStyle: 'bold' } }, { content: totalRow.deposito.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), styles: { fontStyle: 'bold' } }, { content: totalRow.paga.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), styles: { fontStyle: 'bold' } }]);
            autoTable(doc, { head, body, startY: doc.lastAutoTable.finalY + 2, theme: 'grid', headStyles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 8 }, bodyStyles: { fontSize: 8 }, columnStyles: { 0: { halign: 'center' }, 1: { halign: 'center' }, 2: { halign: 'left' }, 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'center' }, 8: { halign: 'center' }, 9: { halign: 'center' } } });
            const finalY = doc.lastAutoTable.finalY;
            const granTotal = totalRow.deposito + totalRow.paga;
            const totalEnLetras = NumerosALetras(granTotal, { plural: 'PESOS', singular: 'PESO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
            doc.setFontSize(10); doc.text(`SON ${totalEnLetras}.-`.toUpperCase(), 14, finalY + 10); doc.text(`BUENOS AIRES, ${format(new Date(), 'd \'de\' MMMM \'de\' yyyy', { locale: es })}`.toUpperCase(), 14, finalY + 15);
            doc.save(`Planilla_Detallada_${fileNameSuffix}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        };

        const reportBaseDate = selectedDate;
        let startDate, endDate, reportTitle, fileNameSuffix;
        if (reportType === 'quincenal-1' || reportType === 'quincenal-2') {
            if (reportType === 'quincenal-1') { startDate = startOfMonth(reportBaseDate); endDate = setDate(reportBaseDate, 15); reportTitle = "PLANILLA 1RA QUINCENA DE REFRIGERIO"; fileNameSuffix = "1ra_Quincena"; }
            else { startDate = setDate(reportBaseDate, 16); endDate = endOfMonth(reportBaseDate); reportTitle = "PLANILLA 2DA QUINCENA DE REFRIGERIO"; fileNameSuffix = "2da_Quincena"; }
            await generateDetailedReport(startDate, endDate, reportTitle, fileNameSuffix); return;
        }

        let groupFilter = 'todos';
        let startDay, endDay;
        const lastDayOfMonth = getDaysInMonth(reportBaseDate);
        switch (reportType) {
            case 'superiores': groupFilter = 'superiores'; reportTitle = "PLANILLA MENSUAL DE REFRIGERIO (SUPERIORES)"; fileNameSuffix = "Superiores"; break;
            case 'subalternos': groupFilter = 'subalternos'; reportTitle = "PLANILLA MENSUAL DE REFRIGERIO (SUBALTERNOS)"; fileNameSuffix = "Subalternos"; break;
            default: return;
        }
        startDate = startOfMonth(reportBaseDate); endDate = endOfMonth(reportBaseDate); startDay = 1; endDay = lastDayOfMonth;
        const allLogsUrl = `${API_BASE_URL}/api/rations?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`;
        const allLogsInRange = await (await fetch(allLogsUrl)).json();
        const logsByPerson = allLogsInRange.reduce((acc, log) => { (acc[log.personnel_dni] = acc[log.personnel_dni] || []).push(log); return acc; }, {});
        let personnelToDisplay = activePersonnel
            .map(person => ({ person, personLogs: logsByPerson[person.dni] || [], cantRac: (logsByPerson[person.dni] || []).reduce((sum, log) => sum + (log.cantidad_raciones || 0), 0), jerarquiaCorta: (person.jerarquia || '').substring(0, 2).toUpperCase() }))
            .filter(item => item.cantRac > 0)
            .filter(item => { if (groupFilter === 'superiores') return jerarquiasSuperiores.includes(item.jerarquiaCorta); if (groupFilter === 'subalternos') return jerarquiasSubalternos.includes(item.jerarquiaCorta); return true; })
            // CAMBIO 3: Ordenamiento por jerarquía y luego por DNI, también para este reporte.
            .sort((a, b) => {
                const rankA = rankOrder[a.jerarquiaCorta] ?? 99;
                const rankB = rankOrder[b.jerarquiaCorta] ?? 99;
                if (rankA !== rankB) {
                    return rankA - rankB;
                }
                return parseInt(a.person.dni, 10) - parseInt(b.person.dni, 10);
            });
        if (personnelToDisplay.length === 0) { alert("No hay datos para generar la Planilla de Racionamiento."); return; }
        const doc = new jsPDF({ orientation: 'landscape', format: 'legal' });
        autoTable(doc, { body: [['PREFECTURA DE ZONA RIO DE LA PLATA'], ['AUTORIDAD MARITIMA'], [reportTitle], [`Período del ${format(startDate, 'dd')} al ${format(endDate, 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}`]], theme: 'plain', styles: { halign: 'left', fontSize: 10, fontStyle: 'bold' }, margin: { left: 14 } });
        const dayHeaders = Array.from({ length: (endDay - startDay + 1) }, (_, i) => (startDay + i).toString());
        const head_1 = ['', '', '', ...Array(dayHeaders.length).fill('R'), { content: 'TOTAL MENSUAL', colSpan: 3, styles: { fontStyle: 'bold' } }];
        const head_2 = ['JR', 'D.N.I.', 'APELLIDO Y NOMBRE', ...dayHeaders, 'IMP.UNIT.', 'CANT.RAC.', 'IMP.TOTAL'];
        const dailyTotals = Array(dayHeaders.length).fill(0);
        const body = personnelToDisplay.map(item => {
            const { person, personLogs, cantRac } = item;
            const impTotal = cantRac * RATION_PRICE;
            const rowData = [item.jerarquiaCorta, person.dni, `${person.apellido}, ${person.nombre}`];
            for (let i = 0; i < dayHeaders.length; i++) { const day = startDay + i; const dateToFind = format(setDate(reportBaseDate, day), 'yyyy-MM-dd'); const log = personLogs.find(l => l.fecha === dateToFind && l.cantidad_raciones > 0); if (log) { const dailyRations = log.cantidad_raciones; rowData.push(dailyRations.toString()); dailyTotals[i] += dailyRations; } else { rowData.push(''); } }
            rowData.push(RATION_PRICE.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), cantRac, impTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }));
            return rowData;
        });
        const totalRacionesDiarias = dailyTotals.reduce((sum, total) => sum + total, 0);
        const importeTotalDiario = totalRacionesDiarias * RATION_PRICE;
        const dailyTotalsRow = [{ content: 'TOTAL DIARIO', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, ...dailyTotals.map(total => ({ content: total > 0 ? total.toString() : '', styles: { fontStyle: 'bold', halign: 'center' } })), { content: RATION_PRICE.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }), styles: { fontStyle: 'bold', halign: 'right' } }, { content: totalRacionesDiarias > 0 ? totalRacionesDiarias.toString() : '', styles: { fontStyle: 'bold', halign: 'center' } }, { content: importeTotalDiario > 0 ? importeTotalDiario.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '', styles: { fontStyle: 'bold', halign: 'right' } }];
        body.push(dailyTotalsRow);
        const columnStyles = { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 20, halign: 'right' }, 2: { cellWidth: 45, halign: 'left' } };
        dayHeaders.forEach((_, i) => { columnStyles[i + 3] = { cellWidth: 6, halign: 'center' }; });
        const totalColsStartIndex = dayHeaders.length + 3;
        columnStyles[totalColsStartIndex] = { cellWidth: 20, halign: 'right' }; columnStyles[totalColsStartIndex + 1] = { cellWidth: 15, halign: 'center' }; columnStyles[totalColsStartIndex + 2] = { cellWidth: 22, halign: 'right' };
        autoTable(doc, { head: [head_1, head_2], body, startY: doc.lastAutoTable.finalY + 2, theme: 'grid', headStyles: { fillColor: [224, 224, 224], textColor: 0, fontStyle: 'bold', halign: 'center', fontSize: 6, cellPadding: 1, lineWidth: 0.1, lineColor: 0 }, bodyStyles: { textColor: 0, fontSize: 7, cellPadding: 1, lineWidth: 0.1, lineColor: 0 }, columnStyles });
        const finalY = doc.lastAutoTable.finalY;
        const totalGeneralImporte = personnelToDisplay.reduce((sum, item) => sum + (item.cantRac * RATION_PRICE), 0);
        const totalEnLetras = NumerosALetras(totalGeneralImporte, { plural: 'PESOS', singular: 'PESO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
        doc.setFontSize(10); doc.text(`SON ${totalEnLetras}.-`.toUpperCase(), 14, finalY + 10); doc.text(`BUENOS AIRES, ${format(new Date(), 'd \'de\' MMMM \'de\' yyyy', { locale: es })}`.toUpperCase(), 14, finalY + 15);
        doc.save(`Planilla_Racionamiento_${fileNameSuffix}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Registro Diario</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <DatePicker label="Seleccionar Día" value={selectedDate} onChange={(d) => d && setSelectedDate(d)} />
                    <Autocomplete key={autocompleteKey} options={activePersonnel.filter(p => !personnelInTable.some(pt => pt.dni === p.dni))} getOptionLabel={(option) => `${option.apellido}, ${option.nombre}`} onChange={(event, newValue) => { if (newValue) handleAddPersonToTable(newValue); }} sx={{ flexGrow: 1 }} renderInput={(params) => <TextField {...params} label="Añadir Personal al Día" />} disabled={loadingDate} />
                    <Button variant="contained" color="primary" startIcon={<Save />} onClick={handleSaveChanges} disabled={Object.keys(changesToSave).length === 0}>Guardar Cambios</Button>
                    <Button variant="outlined" startIcon={<FileDownload />} onClick={(e) => setAnchorEl(e.currentTarget)}>Exportar</Button>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                        <MenuItem onClick={() => handleExportPDF('quincenal-1')}>Planilla Racionamiento (1ra Quincena)</MenuItem>
                        <MenuItem onClick={() => handleExportPDF('quincenal-2')}>Planilla Racionamiento (2da Quincena)</MenuItem>
                        <MenuItem onClick={() => handleExportPDF('superiores')}>Planilla Mensual (Superiores)</MenuItem>
                        <MenuItem onClick={() => handleExportPDF('subalternos')}>Planilla Mensual (Subalternos)</MenuItem>
                    </Menu>
                </Box>
            </Paper>

            {/* CAMBIO 1: Se añade la propiedad `stickyHeader` a Table y se limita la altura del contenedor. */}
            <TableContainer component={Paper} sx={{ maxHeight: '65vh' }}>
                {loadingDate ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box> :
                    <Table size="small" stickyHeader aria-label="sticky table">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Personal</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Racionó (+9hs)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Guardia </TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Gamela</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Gamela x2</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold', width: '25%' }}>Estado del Día</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {personnelInTable.map(person => {
                                const record = dailyRecords[person.dni] || { raciones: 0, comidas: 0 };
                                const balance = record.raciones - record.comidas;
                                let statusText, statusColor;
                                if (record.raciones === 0 && record.comidas === 0) { statusText = 'Sin Registro'; statusColor = 'transparent'; }
                                else if (balance === 0) { statusText = 'Gamela simple'; statusColor = 'success.light'; }
                                else if (balance > 0) { const dev = (balance * RATION_PRICE).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }); statusText = `Se debe ${balance} Ración(es) (+${dev})`; statusColor = 'info.light'; }
                                else { const costo = (Math.abs(balance) * (record.raciones === 0 ? MEAL_COST_TOTAL : RATION_PRICE)).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }); statusText = `Nos Debe ${Math.abs(balance)} Ración(s) (-${costo})`; statusColor = 'error.light'; }
                                return (
                                    <TableRow key={person.dni} hover sx={{ bgcolor: changesToSave[person.dni] ? 'action.hover' : 'transparent' }}>
                                        <TableCell>{`${person.apellido}, ${person.nombre}`}</TableCell>
                                        <TableCell align="center"><Switch checked={record.raciones === 1} onChange={() => handleToggle(person.dni, 'raciones', 1)} /></TableCell>
                                        <TableCell align="center"><Switch checked={record.raciones === 2} onChange={() => handleToggle(person.dni, 'raciones', 2)} /></TableCell>
                                        <TableCell align="center"><Switch checked={record.comidas === 1} onChange={() => handleToggle(person.dni, 'comidas', 1)} color="warning" /></TableCell>
                                        <TableCell align="center"><Switch checked={record.comidas === 2} onChange={() => handleToggle(person.dni, 'comidas', 2)} color="warning" /></TableCell>
                                        <TableCell align="center" sx={{ bgcolor: statusColor, color: 'text.primary', borderRadius: 1, p: '6px' }}>{statusText}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Borrar registro del día">
                                                <IconButton size="small" color="warning" onClick={() => handleOpenConfirmDialog(person)}>
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                }
            </TableContainer>
            <ConfirmDialog
                open={confirmInfo.open}
                onClose={handleCloseConfirmDialog}
                onConfirm={handleConfirmRemove}
                title="Confirmar Eliminación"
            >
                <Typography>
                    ¿Está seguro que desea eliminar el registro de
                    <strong>{` ${confirmInfo.person?.apellido}, ${confirmInfo.person?.nombre} `}</strong>
                    para este día?
                </Typography>
            </ConfirmDialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </LocalizationProvider >
    );
}

// --- SUB-COMPONENTE: VISTA DE GESTIÓN DE PERSONAL ---
function PersonnelManagement({ allPersonnel, refreshPersonnel, showSnackbar }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState(null);
    const [isNewPerson, setIsNewPerson] = useState(false);

    const handleOpenDialog = (p = null) => {
        if (p) {
            // Modo "Editar"
            setEditingPerson(p);
            setIsNewPerson(false);
        } else {
            // Modo "Agregar"
            setEditingPerson({ dni: '', nombre: '', apellido: '', jerarquia: '', activo: true });
            setIsNewPerson(true);
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => setDialogOpen(false);

    const handleSave = async () => {
        const isEditing = !isNewPerson;
        const url = isEditing ? `${API_BASE_URL}/api/personnel/${editingPerson.dni}` : `${API_BASE_URL}/api/personnel`;
        const method = isEditing ? 'PUT' : 'POST';

        if (!isEditing && !editingPerson.dni.trim()) {
            alert("El campo DNI es obligatorio para agregar nuevo personal.");
            return;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPerson)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error || `Error del servidor: ${response.status} ${response.statusText}`;
                showSnackbar({ open: true, message: `Error: ${errorMessage}`, severity: 'error' });
                return;
            }

            const successMessage = isEditing ? 'Personal actualizado con éxito.' : 'Personal agregado con éxito.';
            showSnackbar({ open: true, message: successMessage, severity: 'success' });

            refreshPersonnel();
            handleCloseDialog();

        } catch (error) {
            showSnackbar({ open: true, message: `Error de conexión: ${error.message}`, severity: 'error' });
        }
    };

    const handleDelete = async (dni) => {
        if (window.confirm('¿Seguro que desea dar de baja a esta persona? (No se borrará, quedará inactiva)')) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/personnel/${dni}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Error al dar de baja');
                showSnackbar({ open: true, message: 'Personal dado de baja con éxito.', severity: 'info' });
                refreshPersonnel();
            } catch (error) {
                showSnackbar({ open: true, message: error.message, severity: 'error' });
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Listado Completo de Personal</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>Agregar Personal</Button>
            </Box>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>DNI</TableCell>
                            <TableCell>Apellido y Nombre</TableCell>
                            <TableCell>Jerarquía</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {allPersonnel.map((p) => (
                            <TableRow key={p.dni} hover sx={{ bgcolor: p.activo ? 'inherit' : 'grey.200' }}>
                                <TableCell>{p.dni}</TableCell>
                                <TableCell>{`${p.apellido}, ${p.nombre}`}</TableCell>
                                <TableCell>{p.jerarquia}</TableCell>
                                <TableCell>{p.activo ? 'Activo' : 'Inactivo'}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Editar"><IconButton size="small" onClick={() => handleOpenDialog(p)}><Edit /></IconButton></Tooltip>
                                    {p.activo && <Tooltip title="Dar de baja"><IconButton size="small" color="error" onClick={() => handleDelete(p.dni)}><Delete /></IconButton></Tooltip>}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>{isNewPerson ? 'Agregar' : 'Editar'} Personal</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '10px !important', width: 400 }}>
                    <TextField
                        label="DNI"
                        value={editingPerson?.dni || ''}
                        disabled={!isNewPerson}
                        onChange={(e) => setEditingPerson({ ...editingPerson, dni: e.target.value })}
                    />
                    <TextField
                        label="Apellido"
                        value={editingPerson?.apellido || ''}
                        onChange={(e) => setEditingPerson({ ...editingPerson, apellido: e.target.value })}
                    />
                    <TextField
                        label="Nombre"
                        value={editingPerson?.nombre || ''}
                        onChange={(e) => setEditingPerson({ ...editingPerson, nombre: e.target.value })}
                    />
                    <TextField
                        label="Jerarquía"
                        value={editingPerson?.jerarquia || ''}
                        onChange={(e) => setEditingPerson({ ...editingPerson, jerarquia: e.target.value })}
                    />
                    {!isNewPerson && (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={!!editingPerson?.activo}
                                    onChange={(e) => setEditingPerson({ ...editingPerson, activo: e.target.checked })}
                                />
                            }
                            label={editingPerson?.activo ? 'Activo' : 'Inactivo'}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" startIcon={<Save />}>Guardar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

// --- COMPONENTE PRINCIPAL QUE UNE TODO ---
export default function Intendencia() {
    const [tabIndex, setTabIndex] = useState(0);
    const [allPersonnel, setAllPersonnel] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const refreshData = useCallback(() => setRefreshTrigger(p => p + 1), []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [personnelRes, settingsRes] = await Promise.all([fetch(`${API_BASE_URL}/api/personnel`), fetch(`${API_BASE_URL}/api/settings`)]);
                if (!personnelRes.ok || !settingsRes.ok) throw new Error('Error al cargar datos iniciales.');
                setAllPersonnel(await personnelRes.json());
                setSettings(await settingsRes.json());
                setError(null);
            } catch (err) { setError(err.message); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [refreshTrigger]);

    const handleSaveSettings = async (newSettings) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSettings) });
            if (!response.ok) throw new Error('No se pudo guardar la configuración.');
            setSettingsDialogOpen(false);
            refreshData();
            setSnackbar({ open: true, message: 'Configuración guardada con éxito', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    const activePersonnel = useMemo(() => allPersonnel.filter(p => p.activo), [allPersonnel]);

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <Container maxWidth="xl">
            <Box>
                {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" component="h1" gutterBottom>
                        Módulo de Intendencia
                    </Typography>
                </Box> */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} aria-label="pestañas de intendencia">
                        <Tab label="Registro Diario de Raciones" />
                        <Tab label="Gestión de Personal" />
                        <Tooltip title="Configurar Precios">
                            <IconButton onClick={() => setSettingsDialogOpen(true)}>
                                <AttachMoneyOutlinedIcon />
                            </IconButton>
                        </Tooltip>
                    </Tabs>
                </Box>
                <Box sx={{ display: tabIndex === 0 ? 'block' : 'none', mt: 2 }}>
                    <RationingView
                        activePersonnel={activePersonnel}
                        settings={settings}
                    />
                </Box>

                <Box sx={{ display: tabIndex === 1 ? 'block' : 'none', mt: 2 }}>
                    <PersonnelManagement
                        allPersonnel={allPersonnel}
                        refreshPersonnel={refreshData}
                        showSnackbar={setSnackbar}
                    />
                </Box>
            </Box>
            <SettingsDialog
                open={settingsDialogOpen}
                onClose={() => setSettingsDialogOpen(false)}
                settings={settings}
                onSave={handleSaveSettings}
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}