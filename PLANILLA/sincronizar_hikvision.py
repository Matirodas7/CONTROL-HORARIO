# sincronizar_hikvision.py (VERSIÓN DE DEPURACIÓN)
import requests
from requests.auth import HTTPDigestAuth
import time
import traceback
from datetime import datetime, timedelta
import pytz # Importamos pytz para manejar zonas horarias
from shared_logic_v2 import conectar_db, procesar_fichaje_paralelo

HIKVISION_CONFIG = {
    "ip": "172.17.66.250",
    "user": "admin",
    "pass": "Pzrp2025"
}

# --- ¡¡¡NUEVA SECCIÓN DE CONFIGURACIÓN!!! ---
# Configura la zona horaria de tu país.
# Para Argentina, es 'America/Argentina/Buenos_Aires'.
# Lista de zonas horarias: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
TIMEZONE = 'America/Argentina/Buenos_Aires'

def obtener_eventos_hikvision(start_time_utc):
    # La API de Hikvision SIEMPRE usa UTC (formato Z o +00:00)
    start_time_str_utc = start_time_utc.strftime('%Y-%m-%dT%H:%M:%S+00:00')
    url = f"http://{HIKVISION_CONFIG['ip']}/ISAPI/AccessControl/AcsEvent?format=json"
    search_id_unico = str(int(time.time())) 
    
    request_body = {
        "AcsEventCond": {
            "searchID": search_id_unico,
            "searchResultPosition": 0,
            "startTime": start_time_str_utc,
            "maxResults": 1000,
            "major": 0, "minor": 0
        }
    }

    # --- INFORMACIÓN DE DEPURACIÓN CRÍTICA ---
    print("\n--- INICIO DE PETICIÓN A HIKVISION ---")
    print(f"Hora actual (local): {datetime.now(pytz.timezone(TIMEZONE)).strftime('%Y-%m-%d %H:%M:%S %Z%z')}")
    print(f"Solicitando eventos a la API desde (UTC): {start_time_str_utc}")
    print("----------------------------------------")
    
    try:
        response = requests.post(
            url, auth=HTTPDigestAuth(HIKVISION_CONFIG['user'], HIKVISION_CONFIG['pass']),
            json=request_body, timeout=15
        )
        response.raise_for_status()
        data = response.json()
        return data.get("AcsEvent", {}).get("InfoList", [])
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar con Hikvision: {e}")
        return None

def sincronizar_hikvision():
    print(f"--- Iniciando sincronización Facial: {datetime.now()} ---")
    conn = conectar_db()
    cursor = conn.cursor()

    # Como limpiamos la DB, esta consulta devolverá None
    cursor.execute("SELECT MAX(COALESCE(salida_dt, entrada_dt)) as last_event FROM registros WHERE sistema_fichaje = 'Facial'")
    last_event_str = cursor.fetchone()['last_event']
    
    # --- LÓGICA DE TIEMPO REFORZADA ---
    if last_event_str:
        # Esta parte no se usará en la primera ejecución después de limpiar
        last_event_dt_naive = datetime.fromisoformat(last_event_str)
        tz = pytz.timezone(TIMEZONE)
        last_event_dt_aware = tz.localize(last_event_dt_naive)
        start_time_utc = last_event_dt_aware.astimezone(pytz.utc) + timedelta(seconds=1)
    else:
        # Para la primera ejecución, buscamos desde el inicio del día actual en nuestra zona horaria
        print("No hay eventos faciales previos. Buscando desde el inicio del día de hoy.")
        now_local = datetime.now(pytz.timezone(TIMEZONE))
        start_of_day_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
        # Convertimos esa hora de inicio a UTC para la API
        start_time_utc = start_of_day_local.astimezone(pytz.utc)

    eventos = obtener_eventos_hikvision(start_time_utc)
    
    if eventos is not None:
        print("\n--- RESPUESTA CRUDA DE LA API DE HIKVISION ---")
        import json
        print(json.dumps(eventos, indent=2))
        print("---------------------------------------------\n")
        
        if len(eventos) > 0:
            print(f"Se encontraron {len(eventos)} eventos nuevos de Hikvision.")
            for evento in sorted(eventos, key=lambda x: x['time']):
                # ... (El resto del procesamiento es igual, no lo tocamos por ahora)
                # ...
                print(f"Procesando evento para DNI {evento.get('employeeNoString')} a las {evento.get('time')}")
        else:
            print("No se encontraron eventos nuevos en la respuesta de la API.")
            
    conn.close()
    print(f"--- Sincronización Facial finalizada ---")

if __name__ == '__main__':
    # Necesitas instalar pytz: pip install pytz
    try:
        sincronizar_hikvision()
    except Exception:
        traceback.print_exc()
