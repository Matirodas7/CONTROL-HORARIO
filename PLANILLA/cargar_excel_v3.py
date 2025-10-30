# cargar_excel_v3.py (VERSIÓN FINAL CORREGIDA PARA ZONAS HORARIAS)

import pandas as pd
import traceback
from datetime import datetime
import pytz

# Asegúrate de que shared_logic_v2.py esté en el mismo directorio
# y haya sido actualizado para usar PostgreSQL.
from shared_logic_v2 import conectar_db, procesar_fichaje_paralelo

print("--- SCRIPT DE CARGA DE EXCEL (SISTEMA HUELLA) ---")

# --- CONFIGURACIÓN ---
# Ruta de red al archivo Excel. Usamos una 'r' antes del string para
# manejar correctamente las barras invertidas de las rutas de Windows.
EXCEL_PATH = r'//servidor-pzrp/PZRP/PRIMER PISO/PERSONAL/registros_nuevos.xlsx'
TIMEZONE = 'America/Argentina/Buenos_Aires'
LOCAL_TZ = pytz.timezone(TIMEZONE)

def obtener_ultimo_fichaje(conn):
    """
    Consulta la base de datos para obtener la fecha y hora del último fichaje
    registrado por el sistema 'Huella'.
    """
    with conn.cursor() as cursor:
        query = """
            SELECT MAX(COALESCE(salida_dt, entrada_dt)) 
            FROM registros 
            WHERE sistema_fichaje = 'Huella' 
        """
        cursor.execute(query)
        resultado = cursor.fetchone()

        if resultado and resultado[0]:
            ultimo_evento_db = resultado[0]
            
            # --- INICIO DE LA CORRECCIÓN DE ZONA HORARIA ---
            # Verificamos si la fecha de la BD ya tiene información de timezone.
            if ultimo_evento_db.tzinfo is None or ultimo_evento_db.tzinfo.utcoffset(ultimo_evento_db) is None:
                # Es "naive" (ingenua), le asignamos nuestra zona horaria local.
                ultimo_evento_aware = LOCAL_TZ.localize(ultimo_evento_db)
            else:
                # Ya es "aware" (consciente), la convertimos a nuestra zona horaria local para consistencia.
                ultimo_evento_aware = ultimo_evento_db.astimezone(LOCAL_TZ)
            # --- FIN DE LA CORRECCIÓN DE ZONA HORARIA ---

            print(f"Último evento de 'Huella' encontrado en BD: {ultimo_evento_aware.strftime('%Y-%m-%d %H:%M:%S')}")
            return ultimo_evento_aware
        else:
            print("No se encontraron fichajes previos para 'Huella'. Se procesará el archivo completo.")
            return LOCAL_TZ.localize(datetime(2000, 1, 1))

def ejecutar_carga_excel():
    """
    Función principal que orquesta la lectura del Excel y la carga de datos.
    """
    try:
        with conectar_db() as conn:
            print("\n[PASO 1/4] Conexión a la base de datos PostgreSQL establecida.")
            ultimo_fichaje_procesado = obtener_ultimo_fichaje(conn)

            print(f"\n[PASO 2/4] Leyendo archivo Excel desde la ruta de red...")
            df_total = pd.read_excel(EXCEL_PATH, engine='openpyxl')
            
            mapeo_columnas = {
                'Usuario Nro.': 'dni', 'Fecha/Hora': 'fecha_hora',
                'Nombre': 'nombre', 'Posición': 'jerarquia'
            }
            df_total.rename(columns=mapeo_columnas, inplace=True)

            df_total['fecha_hora'] = pd.to_datetime(df_total['fecha_hora'], errors='coerce')
            df_total.dropna(subset=['fecha_hora'], inplace=True)
            # A diferencia de la lectura de la BD, aquí las fechas del Excel son "naive",
            # por lo que tz_localize es el método correcto.
            df_total['fecha_hora'] = df_total['fecha_hora'].dt.tz_localize(LOCAL_TZ)

            df_nuevos = df_total[df_total['fecha_hora'] > ultimo_fichaje_procesado].copy()
            df_nuevos.sort_values(by='fecha_hora', ascending=True, inplace=True)

            if df_nuevos.empty:
                print("\nNo se encontraron nuevos fichajes en el Excel. La base de datos ya está actualizada.")
                return

            print(f"\n[PASO 3/4] Se encontraron {len(df_nuevos)} nuevos fichajes para procesar.")
            
            df_nuevos['dni'] = pd.to_numeric(df_nuevos['dni'], errors='coerce').astype('Int64').astype(str).replace('<NA>', None)
            df_nuevos.dropna(subset=['dni'], inplace=True)
            
            if df_nuevos.empty:
                print("\nDespués de la limpieza de DNI, no quedaron registros válidos.")
                return
                
            df_nuevos['nombre'] = df_nuevos['nombre'].fillna('Desconocido')
            # Usamos .get() por si la columna 'jerarquia' no existe en el Excel
            if 'jerarquia' in df_nuevos.columns:
                 df_nuevos['jerarquia'] = df_nuevos['jerarquia'].fillna('N/A')
            else:
                 df_nuevos['jerarquia'] = 'N/A'
            
            print("\n[PASO 4/4] Insertando los nuevos fichajes en la base de datos...")
            for index, row in df_nuevos.iterrows():
                procesar_fichaje_paralelo(
                    conn=conn, dni=row['dni'], event_dt=row['fecha_hora'],
                    nombre=row['nombre'], jerarquia=row['jerarquia'], sistema="Huella"
                )
            
            conn.commit()
            print("\n¡Éxito! La carga de nuevos registros desde el Excel ha finalizado.")

    except FileNotFoundError:
        print(f"\nERROR CRÍTICO: No se pudo encontrar el archivo Excel en la ruta especificada:")
        print(f"  {EXCEL_PATH}")
        print("  Verifique que la ruta sea correcta y que tenga permisos de acceso.")
    except Exception:
        print("\nOcurrió un error inesperado durante la carga del Excel:")
        traceback.print_exc()

if __name__ == "__main__":
    ejecutar_carga_excel()
    input("\nProceso finalizado. Presione Enter para salir.")