@echo off
REM Paso 1: Ejecutar cargar_nuevo.py
echo Ejecutando cargar_nuevo.py...
start "" /B python "C:\Users\user\Desktop\CONTROL PZRP\PLANILLA\cargar_nuevo.py"

REM Esperar 2 minutos
timeout /t 120 /nobreak

REM Paso 2: Ejecutar servidor con uvicorn
echo Iniciando servidor con uvicorn...
start "" /B cmd /k python -m uvicorn servidor:app --reload

REM Esperar 1 minuto más (total 3 desde el inicio)
timeout /t 60 /nobreak

REM Paso 3: Ejecutar app.py (servidor Flask)
echo Ejecutando app.py...
start "" /B python "C:\Users\user\Desktop\CONTROL PZRP\PLANILLA\app.py"
