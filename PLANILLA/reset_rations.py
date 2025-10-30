import sqlite3
import os

DB_FILE = 'registros_prueba.db'

def reset_ration_logs_table():
    """
    Borra la tabla 'ration_logs' y la crea de nuevo con la estructura correcta.
    Este script debe ejecutarse solo una vez.
    """
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), DB_FILE)
    if not os.path.exists(db_path):
        print(f"Error: No se encontró el archivo de base de datos '{DB_FILE}'.")
        return

    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("Iniciando la recreación de la tabla 'ration_logs'...")

        # Paso 1: Borrar la tabla si existe.
        print("Paso 1: Borrando la tabla 'ration_logs' existente...")
        cursor.execute("DROP TABLE IF EXISTS ration_logs;")
        print("Tabla 'ration_logs' borrada.")

        # Paso 2: Crear la nueva tabla con la estructura correcta.
        print("Paso 2: Creando la nueva tabla 'ration_logs'...")
        cursor.execute('''
            CREATE TABLE ration_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                personnel_dni TEXT NOT NULL, 
                fecha DATE NOT NULL, 
                tipo_gamela TEXT NOT NULL CHECK(tipo_gamela IN ('simple', 'total', 'return')), 
                costo_abonado REAL NOT NULL, 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                FOREIGN KEY (personnel_dni) REFERENCES personnel (dni)
            )
        ''')
        print("Nueva tabla 'ration_logs' creada con la estructura correcta.")

        conn.commit()
        
        print("\n¡Proceso completado con éxito!")
        print("La tabla 'ration_logs' ha sido recreada.")

    except sqlite3.Error as e:
        print(f"\n¡ERROR! Ocurrió un problema: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            print("Conexión a la base de datos cerrada.")

if __name__ == '__main__':
    # Preguntar al usuario para seguridad extra
    confirm = input("¿Estás seguro de que quieres borrar TODOS los datos de la tabla 'ration_logs' y recrearla? (s/n): ")
    if confirm.lower() == 's':
        reset_ration_logs_table()
    else:
        print("Operación cancelada.")