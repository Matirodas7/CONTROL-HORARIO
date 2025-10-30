from fastapi import FastAPI
import sqlite3
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Permitir peticiones desde cualquier origen (útil para desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/registros")
def obtener_registros():
    try:
        conn = sqlite3.connect("registros.db")
        df = pd.read_sql_query("SELECT * FROM registros", conn)

        # Renombrar columnas para estandarizar nombres
        df.rename(columns={
            "Usuario Nro.": "dni",
            "Posición":"jerarquia",
            "Nombre": "nombre",
            "Fecha": "fecha",
            "Ingreso": "entrada",
            "Egreso": "salida",
        }, inplace=True)

        # Asegurar formato correcto
        df["fecha"] = pd.to_datetime(df["fecha"]).dt.date
        df["entrada"] = pd.to_datetime(df["entrada"], errors="coerce").dt.time
        df["salida"] = pd.to_datetime(df["salida"], errors="coerce").dt.time

        # Convertir a lista de diccionarios
        registros = df.to_dict(orient="records")

        return registros

    except Exception as e:
        return {"error": str(e)}
