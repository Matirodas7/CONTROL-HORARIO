// PersonalInfoDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Card, CardMedia, CardContent, Typography
} from '@mui/material';

const PersonalInfoDialog = ({ open, onClose, personalInfo }) => {
    if (!personalInfo) {
        return null; // O algún placeholder si prefieres
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="personal-info-dialog-title"
            maxWidth="xs"
            fullWidth
        >
            <DialogTitle id="personal-info-dialog-title" sx={{ textAlign: 'center', pb: 1 }}>
                {personalInfo.nombre}
            </DialogTitle>
            <DialogContent sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Card sx={{ width: 250, height: 'auto', mb: 1 }}>
                    <CardMedia
                        component="img"
                        sx={{
                            width: '100%',
                            height: 250,
                            objectFit: 'contain', // Como lo ajustamos antes
                            // Opcional: bgcolor: 'grey.200' si quieres fondo para letterboxing
                        }}
                        image={personalInfo.fotoUrl}
                        alt={`Foto de ${personalInfo.nombre}`}
                        onError={(e) => {
                            e.target.onerror = null; // previene loop si default.jpg también falla
                            e.target.src = "/fotos_personal/default.jpg";
                        }}
                    />
                    <CardContent sx={{ pt: 1, pb: '8px !important', textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">DNI: {personalInfo.dni}</Typography>
                        <Typography variant="body2" color="text.secondary">Jerarquía: {personalInfo.jerarquia}</Typography>
                        <Typography variant="body2" color="text.secondary">Oficina: {personalInfo.oficina}</Typography>
                        {/* Puedes agregar más campos aquí si es necesario */}
                    </CardContent>
                </Card>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button onClick={onClose} variant="outlined">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PersonalInfoDialog;