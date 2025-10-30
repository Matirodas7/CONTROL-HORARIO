# limpiar_registros_faciales.py
import sqlite3
import os
import sys

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'registros_prueba.db')

print(f"Este script eliminará TODOS los registros con sistema_fichaje = 'Facial'")
print(f"en la base de datos: {DB_PATH}")

respuesta = input("¿Estás seguro de que quieres continuar? (escribe 'si' para confirmar): ")

if respuesta.lower() != 'si':
    print("Operación cancelada.")
    sys.exit()

conn = None
try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("\nEliminando todos los registros de tipo 'Facial'...")
    cursor.execute("DELETE FROM registros WHERE sistema_fichaje = 'Facial';")
    
    num_filas_eliminadas = cursor.rowcount
    conn.commit()

    print(f"¡Éxito! Se eliminaron {num_filas_eliminadas} registros faciales.")
    print("La base de datos está lista para una nueva carga de datos faciales.")

except sqlite3.Error as e:
    print(f"Ocurrió un error de base de datos: {e}")
    if conn: conn.rollback()
finally:
    if conn: conn.close()