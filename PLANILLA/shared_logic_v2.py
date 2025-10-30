import os
from datetime import datetime
import pytz
import psycopg2
from psycopg2.extras import DictCursor
from dotenv import load_dotenv

load_dotenv()

MAX_HORAS_TURNO_VALIDO = 32
TIMEZONE = 'America/Argentina/Buenos_Aires'

def conectar_db():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error fatal al conectar con la base de datos PostgreSQL: {e}")
        raise

def procesar_fichaje_paralelo(conn, dni, event_dt, nombre, jerarquia, sistema):
    with conn.cursor(cursor_factory=DictCursor) as cursor:
        event_dt_display_str = event_dt.strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute(
            """
            SELECT id, entrada_dt FROM registros 
            WHERE dni = %s AND sistema_fichaje = %s AND salida_dt IS NULL 
            ORDER BY entrada_dt DESC LIMIT 1
            """,
            (dni, sistema)
        )
        registro_abierto = cursor.fetchone()

        if registro_abierto:
            id_registro_abierto = registro_abierto['id']
            entrada_abierta_dt_naive = registro_abierto['entrada_dt']
            local_tz = pytz.timezone(TIMEZONE)
            if entrada_abierta_dt_naive.tzinfo is None:
                entrada_abierta_dt = local_tz.localize(entrada_abierta_dt_naive)
            else:
                entrada_abierta_dt = entrada_abierta_dt_naive.astimezone(local_tz)

            if event_dt <= entrada_abierta_dt:
                print(f"  [{sistema}] DNI {dni}: Fichaje a las {event_dt_display_str} ignorado (es anterior o igual a la entrada abierta de las {entrada_abierta_dt}).")
                return

            duracion_horas = (event_dt - entrada_abierta_dt).total_seconds() / 3600.0
            if duracion_horas <= MAX_HORAS_TURNO_VALIDO:
                print(f"  [{sistema}] DNI {dni}: Cerrando turno. Salida: {event_dt_display_str}")
                # --- DEBUG PRINT 4 ---
                print(f"DEBUG: Ejecutando UPDATE en id={id_registro_abierto} con fecha={event_dt}")
                cursor.execute("UPDATE registros SET salida_dt = %s WHERE id = %s", (event_dt, id_registro_abierto))
            else:
                print(f"  [{sistema}] DNI {dni}: SALIDA FALTANTE asumida. Abriendo nuevo turno con entrada: {event_dt_display_str}")
                # --- DEBUG PRINT 5 ---
                print(f"DEBUG: Ejecutando INSERT con fecha={event_dt}")
                cursor.execute("INSERT INTO registros (dni, jerarquia, nombre, entrada_dt, sistema_fichaje) VALUES (%s, %s, %s, %s, %s)", (dni, jerarquia, nombre, event_dt, sistema))
        else:
            print(f"  [{sistema}] DNI {dni}: Abriendo nuevo turno. Entrada: {event_dt_display_str}")
            # --- DEBUG PRINT 6 ---
            print(f"DEBUG: Ejecutando INSERT con fecha={event_dt}")
            cursor.execute("INSERT INTO registros (dni, jerarquia, nombre, entrada_dt, sistema_fichaje) VALUES (%s, %s, %s, %s, %s)", (dni, jerarquia, nombre, event_dt, sistema))