# migracion.py (VERSION 5 - FINAL CON VALIDACION DE NO NULOS)
import sqlite3
import psycopg2
import os

# --- CONFIGURACION ---
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'registros_prueba.db')

PG_CONFIG = {
    "dbname": "control_personal",
    "user": "postgres",
    "password": 4208,  # <-- !!! CAMBIA ESTO POR TU CONTRASENA !!!
    "host": "localhost",
    "port": "5432"
}

# --- ESQUEMA SQL PARA POSTGRESQL ---
SCHEMA_SQL = """
DROP TABLE IF EXISTS registros, comentarios, personnel, ration_logs, settings CASCADE;

CREATE TABLE personnel (
    dni TEXT PRIMARY KEY, nombre TEXT NOT NULL, apellido TEXT NOT NULL,
    jerarquia TEXT, activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE registros (
    id SERIAL PRIMARY KEY, dni TEXT NOT NULL, jerarquia TEXT, nombre TEXT,
    entrada_dt TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    salida_dt TIMESTAMP WITHOUT TIME ZONE,
    sistema_fichaje TEXT NOT NULL CHECK(sistema_fichaje IN ('Huella', 'Facial'))
);
CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY, registro_dni TEXT NOT NULL, registro_entrada_fecha TEXT NOT NULL, 
    comentario TEXT NOT NULL, fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ration_logs (
    id SERIAL PRIMARY KEY, personnel_dni TEXT NOT NULL, fecha DATE NOT NULL,
    tipo_gamela TEXT NOT NULL, cantidad_raciones INTEGER NOT NULL DEFAULT 0,
    cantidad_comidas INTEGER NOT NULL DEFAULT 0, costo_abonado REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (personnel_dni) REFERENCES personnel (dni) ON DELETE CASCADE
);
CREATE TABLE settings (
    key TEXT PRIMARY KEY, value TEXT NOT NULL
);
"""

# --- SCRIPT DE MIGRACION ---
print("Iniciando migracion de SQLite a PostgreSQL...")
conn_sqlite = None
conn_pg = None

try:
    conn_sqlite = sqlite3.connect(SQLITE_DB_PATH)
    conn_sqlite.row_factory = sqlite3.Row
    conn_pg = psycopg2.connect(**PG_CONFIG)
    cur_pg = conn_pg.cursor()
    print("Conexiones establecidas con exito.")

    print("\n[PASO 1/3] Borrando esquema antiguo y creando tablas nuevas en PostgreSQL...")
    cur_pg.execute(SCHEMA_SQL)
    print("Esquema creado con exito.")

    print("\n[PASO 2/3] Leyendo y limpiando datos de SQLite...")
    
    cur_sqlite_temp = conn_sqlite.cursor()
    cur_sqlite_temp.execute("SELECT dni FROM personnel")
    valid_dnis = {row[0] for row in cur_sqlite_temp.fetchall()}
    print(f"Se encontraron {len(valid_dnis)} DNIs validos en la tabla 'personnel' de origen.")
    cur_sqlite_temp.close()

    tablas_a_migrar = ['personnel', 'registros', 'comentarios', 'settings', 'ration_logs']
    for tabla in tablas_a_migrar:
        cur_sqlite = conn_sqlite.cursor()
        print(f"--- Procesando tabla: {tabla} ---")
        
        cur_sqlite.execute(f"SELECT * FROM {tabla}")
        filas_originales = cur_sqlite.fetchall()
        
        if not filas_originales:
            print(f"La tabla '{tabla}' esta vacia. Omitiendo.")
            continue

        columnas = [description[0] for description in cur_sqlite.description]
        filas_limpias = []

        for fila in filas_originales:
            fila_dict = dict(zip(columnas, fila))
            
            # --- NUEVA REGLA DE LIMPIEZA PARA 'registros' ---
            if tabla == 'registros':
                if not fila_dict.get('entrada_dt') or fila_dict.get('entrada_dt') == '':
                    print(f"  -> Omitiendo registro invalido (ID: {fila_dict.get('id')}) por tener entrada_dt vacia.")
                    continue # Salta a la siguiente fila

                for col in ['entrada_dt', 'salida_dt']:
                    if col in fila_dict and fila_dict[col] == '':
                        fila_dict[col] = None
            
            if tabla == 'personnel':
                if 'activo' in fila_dict and fila_dict['activo'] is not None:
                    fila_dict['activo'] = bool(fila_dict['activo'])
            
            if tabla == 'ration_logs':
                if fila_dict['personnel_dni'] not in valid_dnis:
                    continue

            filas_limpias.append(tuple(fila_dict.values()))
        
        if not filas_limpias:
            print(f"No quedaron filas validas para migrar en la tabla '{tabla}'.")
            continue

        columnas_str = ", ".join(columnas)
        placeholders = ", ".join(["%s"]*len(columnas))
        query_insert_pg = f"INSERT INTO {tabla} ({columnas_str}) VALUES ({placeholders})"
        
        cur_pg.executemany(query_insert_pg, filas_limpias)
        print(f"Exito! Se insertaron {len(filas_limpias)} filas en la tabla '{tabla}'.")
    
    print("\n[PASO 3/3] Confirmando todos los cambios en PostgreSQL...")
    conn_pg.commit()
    print("\n¡MIGRACION COMPLETADA CON EXITO!")

except Exception as e:
    print(f"\nERROR CRITICO DURANTE LA MIGRACION: {e}")
    if conn_pg:
        conn_pg.rollback()
        print("Se han revertido todos los cambios en PostgreSQL.")
finally:
    if conn_sqlite: conn_sqlite.close()
    if conn_pg: conn_pg.close()
    print("Conexiones cerradas.")