@echo off
:: Cambia el directorio de trabajo a la carpeta donde está este script
cd /d "C:\Users\user\Desktop\CONTROL PZRP\PLANILLA"

:: Ejecuta el script de Python y guarda toda la salida (normal y errores) en un archivo de log
echo --- Ejecutando tarea a las %date% %time% --- >> log_sync.txt
C:\Python313\python.exe hikvision_sync_v2.py >> log_sync.txt 2>>&1