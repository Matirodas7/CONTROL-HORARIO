# verificar_pg.py
import psycopg2

PG_CONFIG = {
    "dbname": "control_personal",
    "user": "postgres",
    "password": 4208, # <-- ¡¡¡PON TU CONTRASEÑA AQUÍ!!!
    "host": "localhost",
    "port": "5432"
}

print("Intentando conectar a PostgreSQL...")
conn = None
try:
    conn = psycopg2.connect(**PG_CONFIG)
    cur = conn.cursor()
    print("¡Conexion exitosa!")
    
    print("\nBuscando tablas en la base de datos...")
    # Esta consulta lista todas las tablas visibles por el usuario
    cur.execute("""
        SELECT tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
    """)
    
    tablas_encontradas = cur.fetchall()
    
    if not tablas_encontradas:
        print("\nRESULTADO: ¡La base de datos esta VACIA! No se encontraron tablas.")
        print("SOLUCION: Asegurate de ejecutar el script SQL para crear las tablas en pgAdmin.")
    else:
        print("\nRESULTADO: Se encontraron las siguientes tablas:")
        for tabla in tablas_encontradas:
            print(f"- {tabla[0]}")

except Exception as e:
    print(f"\nERROR CRITICO: No se pudo conectar o ejecutar la consulta. Error: {e}")
finally:
    if conn:
        conn.close()
        print("\nConexion cerrada.")