import os
import requests
from requests.auth import HTTPDigestAuth
import time
import traceback
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
import json

from shared_logic_v2 import conectar_db, procesar_fichaje_paralelo

load_dotenv()

HIKVISION_CONFIG = {
    "ip": os.getenv("HIKVISION_IP"),
    "user": os.getenv("HIKVISION_USER"),
    "pass": os.getenv("HIKVISION_PASS")
}
TIMEZONE = 'America/Argentina/Buenos_Aires'
CODIGO_FICHAJE_VALIDO = 75
MAX_RESULTADOS_POR_LOTE = 50

def obtener_eventos_hikvision(start_time_utc):
    start_time_str_utc = start_time_utc.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    url = f"http://{HIKVISION_CONFIG['ip']}/ISAPI/AccessControl/AcsEvent?format=json"
    search_id_unico = f"sync_{int(time.time())}"
    request_body = {
        "AcsEventCond": {
            "searchID": search_id_unico,
            "searchResultPosition": 0,
            "startTime": start_time_str_utc,
            "maxResults": MAX_RESULTADOS_POR_LOTE,
            # --- SOLUCIÓN APLICADA AQUÍ ---
            # Pedimos solo eventos de control de acceso (5) que sean fichajes válidos (75)
            "major": 5,
            "minor": CODIGO_FICHAJE_VALIDO
        }
    }
    print(f"\nSolicitando eventos a la API desde (UTC): {start_time_str_utc}")
    try:
        response = requests.post(url, auth=HTTPDigestAuth(HIKVISION_CONFIG['user'], HIKVISION_CONFIG['pass']), json=request_body, timeout=20)
        response.raise_for_status()
        data = response.json()
        return data.get("AcsEvent", {}).get("InfoList", [])
    except requests.exceptions.RequestException as e:
        print(f"Error crítico al conectar con Hikvision: {e}")
        return None

def sincronizar_hikvision():
    local_tz = pytz.timezone(TIMEZONE)
    print(f"--- Iniciando sincronización Facial: {datetime.now(local_tz).strftime('%Y-%m-%d %H:%M:%S')} ---")
    with conectar_db() as conn:
        while True:
            start_time_utc = None
            with conn.cursor() as cursor:
                cursor.execute("SELECT MAX(COALESCE(salida_dt, entrada_dt)) FROM registros WHERE sistema_fichaje = 'Facial'")
                resultado = cursor.fetchone()
                last_event_dt = resultado[0] if resultado and resultado[0] else None
            
            print(f"DEBUG: Valor leído de la BD (last_event_dt): {last_event_dt} | Tipo: {type(last_event_dt)}")

            if last_event_dt:
                if last_event_dt.tzinfo is None or last_event_dt.tzinfo.utcoffset(last_event_dt) is None:
                    last_event_dt_aware = local_tz.localize(last_event_dt)
                else:
                    last_event_dt_aware = last_event_dt
                start_time_utc = last_event_dt_aware.astimezone(pytz.utc) + timedelta(seconds=1)
            else:
                print("No hay eventos faciales previos. Iniciando carga desde el 28/08/2025.")
                fecha_inicio_fija = datetime(2025, 8, 28, tzinfo=local_tz)
                start_time_utc = fecha_inicio_fija.astimezone(pytz.utc)

            print(f"DEBUG: Hora de inicio para la API (start_time_utc): {start_time_utc}")

            eventos = obtener_eventos_hikvision(start_time_utc)
            if eventos is None:
                print("Error de conexión con el dispositivo. Terminando el proceso.")
                break
            if not eventos:
                print("No se encontraron eventos nuevos. La base de datos está al día.")
                break

            print(f"Se recibieron {len(eventos)} eventos. Filtrando y procesando...")
            eventos_procesados = 0
            
            for evento in sorted(eventos, key=lambda x: x['time']):
                # La siguiente línea se puede eliminar o dejar comentada, ya no es necesaria
                # print(f"--- REVISANDO EVENTO CRUDO ---\n{json.dumps(evento, indent=2)}\n")
                
                # Este 'if' ahora es una doble verificación, lo cual es bueno.
                if evento.get('minor') != CODIGO_FICHAJE_VALIDO:
                    continue
                dni, event_time_str = evento.get('employeeNoString'), evento.get('time')
                if not dni or not event_time_str:
                    continue
                
                event_dt_aware = datetime.fromisoformat(event_time_str)
                if event_dt_aware < start_time_utc:
                    continue
                
                event_dt_local = event_dt_aware.astimezone(local_tz)
                with conn.cursor() as cursor:
                    cursor.execute("SELECT nombre, apellido, jerarquia FROM personnel WHERE dni = %s", (dni,))
                    persona_info = cursor.fetchone()
                if persona_info:
                    nombre_completo = f"{persona_info[1] or ''}, {persona_info[0] or ''}".strip(', ')
                    jerarquia = persona_info[2] or 'N/A'
                    procesar_fichaje_paralelo(conn=conn, dni=dni, event_dt=event_dt_local, nombre=nombre_completo, jerarquia=jerarquia, sistema="Facial")
                    eventos_procesados += 1
                else:
                    print(f"  - ADVERTENCIA: El DNI {dni} del evento no fue encontrado en la tabla 'personnel'.")

            if eventos_procesados > 0:
                print("DEBUG: Intentando hacer conn.commit()...")
                conn.commit()
                print("DEBUG: conn.commit() ejecutado.")
                print(f"\n¡Éxito! Se guardó un lote de {eventos_procesados} registros. Buscando más...")
            else:
                print("\nNo hubo nuevos eventos válidos en este lote para procesar.")
            
            if len(eventos) < MAX_RESULTADOS_POR_LOTE:
                print("Se recibió el último lote de eventos. Sincronización completa.")
                break
    print(f"--- Sincronización Facial finalizada ---")

if __name__ == '__main__':
    try:
        sincronizar_hikvision()
    except Exception:
        print("\n--- ERROR INESPERADO DURANTE LA SINCRONIZACIÓN ---")
        traceback.print_exc()
