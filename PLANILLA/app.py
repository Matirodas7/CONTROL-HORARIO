import os
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import traceback
import psycopg2
from psycopg2.extras import DictCursor

# --- INICIALIZACIÓN DE LA APLICACIÓN ---
app = Flask(__name__)
# Asumiendo que la configuración de CORS es la deseada.
CORS(app, resources={r"/*": {"origins": ["http://172.17.66.106:3000", "http://localhost:3000"]}})

# --- FUNCIÓN DE CONEXIÓN A LA BASE DE DATOS ---
# Esta función debería estar idealmente en un archivo separado, pero la incluyo aquí
# para que el script sea autocontenido. Debes ajustar las credenciales.
def conectar_db():
    """Establece conexión con la base de datos PostgreSQL."""
    try:
        conn = psycopg2.connect(
            dbname="control_personal",
            user="postgres",
            password="4208",
            host="localhost", # o la IP de tu servidor de BD
            port="5432"        
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error al conectar a PostgreSQL: {e}")
        raise e

# NOTA: La función inicializar_db() se elimina. La creación y migración de tablas
# en PostgreSQL se debe gestionar con herramientas como Alembic o un script de migración separado.

# --- ENDPOINT PRINCIPAL DE REGISTROS (VISTA DIARIA) ---
@app.route('/registros', methods=['GET'])
def get_registros_diarios_agrupados():
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado para PostgreSQL (entrada_dt::date)
        query = """
            SELECT
                p.dni, p.nombre, p.apellido, p.jerarquia, r.entrada_dt::date as fecha,
                MIN(CASE WHEN r.sistema_fichaje = 'Huella' THEN r.entrada_dt END) as entrada_huella,
                MAX(CASE WHEN r.sistema_fichaje = 'Huella' AND r.salida_dt IS NOT NULL THEN r.salida_dt END) as salida_huella,
                MIN(CASE WHEN r.sistema_fichaje = 'Facial' THEN r.entrada_dt END) as entrada_facial,
                MAX(CASE WHEN r.sistema_fichaje = 'Facial' AND r.salida_dt IS NOT NULL THEN r.salida_dt END) as salida_facial
            FROM personnel p JOIN registros r ON p.dni = r.dni
            GROUP BY p.dni, p.nombre, p.apellido, p.jerarquia, fecha
            ORDER BY MIN(r.entrada_dt) DESC;
        """
        cursor.execute(query)
        registros_agrupados = cursor.fetchall()
        registros_procesados_list = []
        for reg_dict in registros_agrupados:
            nombre_completo = f"{reg_dict.get('apellido', '')}, {reg_dict.get('nombre', '')}".strip(', ')
            entradas_validas = [e for e in [reg_dict.get('entrada_huella'), reg_dict.get('entrada_facial')] if e]
            salidas_validas = [s for s in [reg_dict.get('salida_huella'), reg_dict.get('salida_facial')] if s]
            
            primera_entrada = min(entradas_validas) if entradas_validas else None
            ultima_salida = max(salidas_validas) if salidas_validas else None
            
            duracion_horas = None
            if primera_entrada and ultima_salida and ultima_salida > primera_entrada:
                duracion_horas = (ultima_salida - primera_entrada).total_seconds() / 3600.0
            
            registros_procesados_list.append({
                'dni': reg_dict['dni'], 'jerarquia': reg_dict['jerarquia'], 'nombre': nombre_completo,
                'fecha': reg_dict['fecha'].isoformat(),
                'entrada_huella': reg_dict.get('entrada_huella').isoformat() if reg_dict.get('entrada_huella') else None,
                'salida_huella': reg_dict.get('salida_huella').isoformat() if reg_dict.get('salida_huella') else None,
                'entrada_facial': reg_dict.get('entrada_facial').isoformat() if reg_dict.get('entrada_facial') else None,
                'salida_facial': reg_dict.get('salida_facial').isoformat() if reg_dict.get('salida_facial') else None,
                'duracion_horas': round(duracion_horas, 2) if duracion_horas is not None else None
            })
        return jsonify(registros_procesados_list)
    except Exception as e:
        print(f"Error general en get_registros_diarios_agrupados: {e}"); traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/turnos', methods=['GET'])
def get_todos_los_turnos():
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado para PostgreSQL (cálculo de duración con EXTRACT EPOCH)
        cursor.execute('''
            SELECT
                r.id, r.dni, r.jerarquia, r.nombre, r.entrada_dt, r.salida_dt, r.sistema_fichaje,
                EXTRACT(EPOCH FROM (r.salida_dt - r.entrada_dt)) / 3600.0 as duracion_horas
            FROM registros r
            WHERE r.salida_dt IS NOT NULL
            ORDER BY r.entrada_dt DESC
        ''')
        turnos = []
        for row in cursor.fetchall():
            row_dict = dict(row)
            row_dict['duracion_horas'] = round(float(row_dict['duracion_horas']), 2) if row_dict['duracion_horas'] is not None else None
            turnos.append(row_dict)
        return jsonify(turnos)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()
        
# --- ENDPOINTS DE COMENTARIOS ---
@app.route('/comentarios', methods=['POST'])
def agregar_comentario():
    conn = None
    try:
        data = request.get_json()
        registro_dni = data.get('registro_dni')
        fecha_asociada = data.get('registro_entrada_fecha')
        comentario_texto = data.get('comentario', '').strip()

        if not all([registro_dni, fecha_asociada, comentario_texto]):
            return jsonify({'message': 'Faltan datos.'}), 400

        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado: %s y RETURNING id
        cursor.execute(
            'INSERT INTO comentarios (registro_dni, registro_entrada_fecha, comentario) VALUES (%s, %s, %s) RETURNING id',
            (registro_dni, fecha_asociada, comentario_texto)
        )
        new_comment_id = cursor.fetchone()['id']
        conn.commit()

        cursor.execute('SELECT id, registro_dni, registro_entrada_fecha as fecha_asociada, comentario, fecha_creacion FROM comentarios WHERE id = %s', (new_comment_id,))
        nuevo_comentario = dict(cursor.fetchone())
        return jsonify({'message': 'Comentario agregado.', 'comentario': nuevo_comentario}), 201
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/comentarios/<int:id>', methods=['PUT'])
def actualizar_comentario(id):
    conn = None
    try:
        data = request.get_json()
        nuevo_comentario = data.get('comentario', '').strip()
        if not nuevo_comentario:
            return jsonify({'message': 'Comentario vacío.'}), 400

        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado: %s y CURRENT_TIMESTAMP
        cursor.execute('UPDATE comentarios SET comentario = %s, fecha_creacion = CURRENT_TIMESTAMP WHERE id = %s', (nuevo_comentario, id))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Comentario no encontrado.'}), 404
        
        conn.commit()
        cursor.execute('SELECT id, registro_dni, registro_entrada_fecha as fecha_asociada, comentario, fecha_creacion FROM comentarios WHERE id = %s', (id,))
        comentario_actualizado = dict(cursor.fetchone())
        return jsonify({'message': 'Comentario actualizado.', 'comentario': comentario_actualizado}), 200
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/comentarios/<int:id>', methods=['DELETE'])
def eliminar_comentario(id):
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        # SQL adaptado: %s
        cursor.execute('DELETE FROM comentarios WHERE id = %s', (id,))
        if cursor.rowcount == 0:
            return jsonify({'message': 'Comentario no encontrado.'}), 404
        conn.commit()
        return jsonify({'message': 'Comentario eliminado.'}), 200
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/comentarios_persona', methods=['GET'])
def get_comentarios_por_persona_y_fecha():
    conn = None
    try:
        dni = request.args.get('dni')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        if not all([dni, fecha_inicio, fecha_fin]):
            return jsonify({'message': 'Parámetros requeridos: dni, fecha_inicio, fecha_fin'}), 400
        
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado: %s
        cursor.execute('''
            SELECT id, registro_dni, registro_entrada_fecha as fecha_asociada, comentario, fecha_creacion 
            FROM comentarios 
            WHERE registro_dni = %s AND registro_entrada_fecha BETWEEN %s AND %s 
            ORDER BY registro_entrada_fecha, fecha_creacion
        ''', (dni, fecha_inicio, fecha_fin))
        comentarios = [dict(row) for row in cursor.fetchall()]
        
    
        return jsonify(comentarios)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

# --- Añade este nuevo endpoint en tu archivo app.py ---

@app.route('/comentarios', methods=['GET'])
def get_todos_los_comentarios():
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # Trae todos los comentarios de una vez
        cursor.execute('''
            SELECT id, registro_dni, registro_entrada_fecha as fecha_asociada, comentario, fecha_creacion 
            FROM comentarios 
            ORDER BY fecha_creacion DESC
        ''')
        comentarios = [dict(row) for row in cursor.fetchall()]
        return jsonify(comentarios)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()
        
# --- ENDPOINTS DE REPORTES (ADAPTADOS) ---
@app.route('/api/resumen-mensual', methods=['GET'])
def obtener_resumen_mensual_api():
    conn = None
    try:
        mes, dni = request.args.get('mes'), request.args.get('dni')
        # SQL adaptado para PostgreSQL (to_char, EXTRACT EPOCH, ::date, ::numeric para round)
        base_query = """
            SELECT 
                to_char(entrada_dt, 'YYYY-MM') AS anio_mes, dni, nombre, jerarquia, 
                COUNT(DISTINCT entrada_dt::date) AS dias_trabajados, COUNT(*) AS turnos_realizados, 
                SUM(EXTRACT(EPOCH FROM (salida_dt - entrada_dt)) / 3600.0) AS total_horas_trabajadas, 
                ROUND(AVG(EXTRACT(EPOCH FROM (salida_dt - entrada_dt)) / 3600.0)::numeric, 2) AS promedio_horas_por_turno 
            FROM registros 
            WHERE salida_dt IS NOT NULL
        """
        conditions, params_sql = [], []
        if mes: 
            conditions.append("to_char(entrada_dt, 'YYYY-MM') = %s")
            params_sql.append(mes)
        if dni: 
            conditions.append("dni = %s")
            params_sql.append(dni)
        if conditions: 
            base_query += " AND " + " AND ".join(conditions)
        base_query += " GROUP BY anio_mes, dni, nombre, jerarquia ORDER BY anio_mes DESC, nombre ASC;"
        
        conn = conectar_db()
        df = pd.read_sql_query(base_query, conn, params=tuple(params_sql))
        df['total_horas_trabajadas'] = pd.to_numeric(df['total_horas_trabajadas'], errors='coerce').round(2)
        df['promedio_horas_por_turno'] = pd.to_numeric(df['promedio_horas_por_turno'], errors='coerce').round(2)
        return jsonify(df.where(pd.notnull(df), None).to_dict(orient='records'))
    except Exception as e: 
        traceback.print_exc()
        return jsonify({"error": f"Error general: {str(e)}"}), 500
    finally:
        if conn: conn.close()

@app.route('/api/meses-disponibles', methods=['GET'])
def obtener_meses_disponibles_api():
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado: to_char
        cursor.execute("SELECT DISTINCT to_char(entrada_dt, 'YYYY-MM') AS anio_mes FROM registros WHERE salida_dt IS NOT NULL ORDER BY anio_mes DESC;")
        return jsonify([row['anio_mes'] for row in cursor.fetchall()])
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/detalle-dias-mes', methods=['GET'])
def obtener_detalle_dias_mes_api():
    conn = None
    try:
        dni, mes = request.args.get('dni'), request.args.get('mes')
        if not dni or not mes: return jsonify({"error": "Parámetros DNI y mes son requeridos."}), 400
        # SQL adaptado: ::date, EXTRACT EPOCH, to_char, %s
        query = """
            SELECT 
                entrada_dt::date AS fecha_dia, 
                SUM(EXTRACT(EPOCH FROM (salida_dt - entrada_dt)) / 3600.0) AS horas_trabajadas_dia 
            FROM registros 
            WHERE dni = %s AND to_char(entrada_dt, 'YYYY-MM') = %s AND salida_dt IS NOT NULL 
            GROUP BY fecha_dia 
            ORDER BY fecha_dia ASC;
        """
        conn = conectar_db()
        df = pd.read_sql_query(query, conn, params=(dni, mes))
        
        mes_dt = datetime.strptime(mes, '%Y-%m')
        next_month = mes_dt.replace(day=28) + timedelta(days=4)
        last_day_of_month = next_month - timedelta(days=next_month.day)
        dias_en_mes = last_day_of_month.day

        dias_del_mes = {f"{mes}-{str(d).zfill(2)}": 0.0 for d in range(1, dias_en_mes + 1)}
        for _, row in df.iterrows():
            fecha_str = row['fecha_dia'].strftime('%Y-%m-%d')
            dias_del_mes[fecha_str] = round(row['horas_trabajadas_dia'] or 0.0, 2)
            
        return jsonify(dias_del_mes)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Error general: {str(e)}"}), 500
    finally:
        if conn: conn.close()

# --- ENDPOINTS DE GESTIÓN DE PERSONAL ---
@app.route('/api/personnel', methods=['GET'])
def get_all_personnel():
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute("SELECT dni, nombre, apellido, jerarquia, activo FROM personnel ORDER BY apellido, nombre")
        return jsonify([dict(row) for row in cursor.fetchall()])
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/personnel', methods=['POST'])
def add_personnel():
    conn = None
    try:
        data = request.get_json()
        dni, nombre, apellido = data.get('dni','').strip(), data.get('nombre','').strip(), data.get('apellido','').strip()
        if not all([dni, nombre, apellido]): return jsonify({'error': 'DNI, Nombre y Apellido son obligatorios.'}), 400
        jerarquia = data.get('jerarquia', '').strip()
        
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # SQL adaptado: %s
        cursor.execute(
            "INSERT INTO personnel (dni, nombre, apellido, jerarquia, activo) VALUES (%s, %s, %s, %s, %s)", 
            (dni, nombre, apellido, jerarquia, data.get('activo', True))
        )
        conn.commit()
        cursor.execute("SELECT * FROM personnel WHERE dni = %s", (dni,))
        return jsonify({'message': 'Personal agregado.', 'person': dict(cursor.fetchone())}), 201
    except psycopg2.IntegrityError:
        if conn: conn.rollback()
        return jsonify({'error': f'Ya existe una persona con el DNI {data.get("dni")}'}), 409
    except Exception as e:
        # (Continuación del bloque 'except' de la función add_personnel)
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': f'Error interno: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/personnel/<string:dni>', methods=['PUT'])
def update_personnel(dni):
    conn = None
    try:
        data = request.get_json()
        if not data: return jsonify({'error': 'No se recibieron datos.'}), 400
        
        fields, values = [], []
        # Construcción dinámica y segura de la consulta UPDATE
        if 'nombre' in data:
            fields.append("nombre = %s")
            values.append(data['nombre'].strip())
        if 'apellido' in data:
            fields.append("apellido = %s")
            values.append(data['apellido'].strip())
        if 'jerarquia' in data:
            fields.append("jerarquia = %s")
            values.append(data.get('jerarquia', '').strip())
        if 'activo' in data and isinstance(data['activo'], bool):
            fields.append("activo = %s")
            values.append(data['activo']) # Enviar booleano directamente

        if not fields: return jsonify({'message': 'No se enviaron campos válidos para actualizar.'}), 400
        
        values.append(dni)
        query = f"UPDATE personnel SET {', '.join(fields)} WHERE dni = %s"
        
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute(query, tuple(values))
        
        if cursor.rowcount == 0:
            return jsonify({'error': f'Personal con DNI {dni} no encontrado.'}), 404
            
        conn.commit()
        cursor.execute("SELECT * FROM personnel WHERE dni = %s", (dni,))
        return jsonify({'message': 'Personal actualizado.', 'person': dict(cursor.fetchone())})
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': f'Error interno: {str(e)}'}), 500
    finally:
        if conn: conn.close()

@app.route('/api/personnel/<string:dni>', methods=['DELETE'])
def delete_personnel(dni):
    """Realiza una baja lógica (soft delete) del personal."""
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        # Se cambia a 'false' para el tipo BOOLEAN de PostgreSQL
        cursor.execute("UPDATE personnel SET activo = false WHERE dni = %s", (dni,))
        if cursor.rowcount == 0:
            return jsonify({'error': 'Personal no encontrado'}), 404
        conn.commit()
        return jsonify({'message': 'Personal dado de baja correctamente'})
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

# --- ENDPOINTS DE INTENDENCIA (RACIONES) ---
@app.route('/api/daily_roster', methods=['GET'])
def get_daily_roster():
    conn = None
    try:
        date_str = request.args.get('date')
        if not date_str: return jsonify({'error': 'El parámetro de fecha es requerido'}), 400
        
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        # La consulta es compatible con PostgreSQL, solo se cambia el placeholder
        query = """
            SELECT p.dni, p.nombre, p.apellido, p.jerarquia, 
                   rl.tipo_gamela, rl.cantidad_raciones, rl.cantidad_comidas, rl.costo_abonado
            FROM personnel p 
            LEFT JOIN ration_logs rl ON p.dni = rl.personnel_dni AND rl.fecha = %s
            WHERE p.activo = true 
            ORDER BY p.apellido, p.nombre;
        """
        cursor.execute(query, (date_str,))
        roster = []
        for row in cursor.fetchall():
            person_data = dict(row)
            # La lógica de procesado se mantiene igual
            log_data = {'tipo_gamela': person_data.pop('tipo_gamela'), 
                        'cantidad_raciones': person_data.pop('cantidad_raciones'), 
                        'cantidad_comidas': person_data.pop('cantidad_comidas'), 
                        'costo_abonado': float(person_data.pop('costo_abonado')) if person_data.get('costo_abonado') is not None else None
                       } if person_data.get('tipo_gamela') else None
            roster.append({**person_data, 'log': log_data})
        return jsonify(roster)
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/update_ration_day', methods=['POST'])
def update_ration_day():
    conn = None
    try:
        data = request.get_json()
        dni = data.get('personnel_dni')
        fecha = data.get('fecha')
        raciones = int(data.get('cantidad_raciones', 0))
        comidas = int(data.get('cantidad_comidas', 0))

        if not all([dni, fecha]): return jsonify({'error': 'Faltan datos (DNI y fecha son requeridos)'}), 400

        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        # Primero, eliminamos el registro existente para ese día y persona
        cursor.execute("DELETE FROM ration_logs WHERE personnel_dni = %s AND fecha = %s", (dni, fecha))
        
        # Si no hay raciones ni comidas, no hacemos nada más
        if raciones == 0 and comidas == 0:
            conn.commit()
            return jsonify({'message': 'Registro del día eliminado/limpiado'}), 200

        # Obtenemos los precios de la configuración
        cursor.execute("SELECT key, value FROM settings")
        settings = {row['key']: float(row['value']) for row in cursor.fetchall()}
        
        # La lógica de negocio para calcular costos y tipo se mantiene
        balance = raciones - comidas
        costo = 0
        tipo_gamela = "N/A"
        
        if balance == 0: tipo_gamela = 'simple_ok' if raciones == 1 else 'doble_ok'
        elif balance > 0:
            costo = balance * settings.get('precio_gamela_simple', 1500.0)
            tipo_gamela = 'devolucion_simple' if balance == 1 else 'devolucion_doble'
        else: # balance < 0
            costo = abs(balance) * settings.get('precio_gamela_total', 5000.0)
            tipo_gamela = 'costo_extra_simple' if balance == -1 else 'costo_extra_doble'

        # Insertamos el nuevo registro
        cursor.execute(
            """INSERT INTO ration_logs (personnel_dni, fecha, tipo_gamela, cantidad_raciones, cantidad_comidas, costo_abonado) 
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (dni, fecha, tipo_gamela, raciones, comidas, costo)
        )
        conn.commit()
        return jsonify({'message': 'Estado del día actualizado'}), 200
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/rations', methods=['GET'])
def get_rations_by_date_range():
    conn = None
    try:
        start_date, end_date = request.args.get('startDate'), request.args.get('endDate')
        if not start_date or not end_date: return jsonify({'error': 'Se requieren startDate y endDate'}), 400
        
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        cursor.execute("SELECT * FROM ration_logs WHERE fecha BETWEEN %s AND %s", (start_date, end_date))
        return jsonify([dict(row) for row in cursor.fetchall()])
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

@app.route('/api/settings', methods=['GET', 'PUT'])
def handle_settings():
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor(cursor_factory=DictCursor)
        
        if request.method == 'GET':
            cursor.execute('SELECT key, value FROM settings')
            return jsonify({row['key']: row['value'] for row in cursor.fetchall()})
            
        if request.method == 'PUT':
            data = request.get_json()
            # Usamos INSERT ... ON CONFLICT para hacer un "upsert" (actualizar si existe, insertar si no)
            query = """
                INSERT INTO settings (key, value) VALUES (%s, %s)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
            """
            # Preparamos los datos para executemany
            settings_to_update = list(data.items())
            
            psycopg2.extras.execute_batch(cursor, query, settings_to_update)
            
            conn.commit()
            return jsonify({'message': 'Configuración actualizada'})
            
    except Exception as e:
        if conn: conn.rollback()
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    finally:
        if conn: conn.close()

# --- ENDPOINT MISCELÁNEO ---
@app.route('/favicon.ico')
def favicon():
    try:
        return app.send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'favicon.ico', mimetype='image/vnd.microsoft.icon')
    except FileNotFoundError:
        return '', 204

# --- SCRIPT DE INICIO ---
if __name__ == '__main__':
    print("Iniciando servidor Flask para PostgreSQL...")
    # La función inicializar_db() ya no se llama aquí.
    # La base de datos y las tablas deben ser creadas previamente con un script de migración.
    app.run(host='0.0.0.0', port=8000, debug=True)
