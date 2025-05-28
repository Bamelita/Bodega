# src/database.py
import sqlite3
import json
from pathlib import Path

DB_DIR = Path("data")
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "inventario.db"

def conectar_db():
    """Establece conexión con la base de datos con configuración optimizada"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")  # Mejor rendimiento para operaciones concurrentes
    conn.row_factory = sqlite3.Row
    return conn

def crear_tablas():
    """Crea las tablas necesarias con validación mejorada y transacción atómica"""
    tablas = {
        "productos": """
            CREATE TABLE IF NOT EXISTS productos (
                codigo TEXT PRIMARY KEY,
                nombre TEXT NOT NULL CHECK(LENGTH(nombre) > 0),
                descripcion TEXT DEFAULT '',
                precio REAL NOT NULL CHECK(precio > 0),
                stock INTEGER NOT NULL CHECK(stock >= 0),
                stock_minimo INTEGER NOT NULL CHECK(stock_minimo >= 0)
            )
        """,
        "movimientos": """
            CREATE TABLE IF NOT EXISTS movimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                detalle TEXT NOT NULL CHECK(LENGTH(detalle) > 0),
                total_bs REAL NOT NULL CHECK(total_bs > 0),
                detalles_extra TEXT
            )
        """,
        "ventas": """
            CREATE TABLE IF NOT EXISTS ventas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                producto TEXT NOT NULL,
                cantidad INTEGER NOT NULL CHECK(cantidad > 0),
                precio REAL NOT NULL CHECK(precio > 0),
                fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
        """,
        "tasa_dolar": """
            CREATE TABLE IF NOT EXISTS tasa_dolar (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                monto REAL NOT NULL CHECK(monto > 0),
                fecha TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
        """
    }
    
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.cursor()
        
        # Ejecutar todas las creaciones en una transacción
        with conn:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            existing_tables = {row['name'] for row in cursor.fetchall()}
            
            for table_name, ddl in tablas.items():
                if table_name not in existing_tables:
                    cursor.execute(ddl)
            
            # Insertar tasa inicial si no existe
            if 'tasa_dolar' not in existing_tables:
                cursor.execute("INSERT INTO tasa_dolar (monto) VALUES (36.0)")
                
    except sqlite3.Error as e:
        raise RuntimeError(f"Error inicializando base de datos: {e}")
    finally:
        if conn:
            conn.close()

def _ejecutar_consulta(query, params=(), commit=False):
    """Función auxiliar para ejecutar consultas"""
    conn = None
    try:
        conn = conectar_db()
        cursor = conn.execute(query, params)
        if commit:
            conn.commit()
        return cursor, conn if not commit else cursor
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        raise RuntimeError(f"Error de base de datos: {e}")

# CRUD para productos
def agregar_producto(codigo, nombre, descripcion, precio, stock, stock_minimo):
    try:
        _ejecutar_consulta(
            '''INSERT INTO productos VALUES (?,?,?,?,?,?)''',
            (codigo, nombre, descripcion, precio, stock, stock_minimo),
            commit=True
        )
        return True
    except Exception as e:
        print(f"Error agregando producto: {e}")
        return False

def obtener_productos():
    try:
        cursor = _ejecutar_consulta('SELECT * FROM productos ORDER BY nombre')
        return cursor.fetchall()
    except Exception as e:
        print(f"Error obteniendo productos: {e}")
        return []

def obtener_producto_por_codigo(codigo):
    try:
        cursor = _ejecutar_consulta(
            'SELECT * FROM productos WHERE codigo = ?', 
            (codigo,)
        )
        return cursor.fetchone()
    except Exception as e:
        print(f"Error obteniendo producto: {e}")
        return None

def actualizar_producto(codigo, nombre, descripcion, precio, stock, stock_minimo):
    try:
        cursor = _ejecutar_consulta(
            '''UPDATE productos SET
                nombre = ?, descripcion = ?, precio = ?,
                stock = ?, stock_minimo = ?
                WHERE codigo = ?''',
            (nombre, descripcion, precio, stock, stock_minimo, codigo),
            commit=True
        )
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error actualizando producto: {e}")
        return False

def eliminar_producto(codigo):
    try:
        cursor = _ejecutar_consulta(
            'DELETE FROM productos WHERE codigo = ?',
            (codigo,),
            commit=True
        )
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error eliminando producto: {e}")
        return False

# Operaciones para movimientos
def registrar_movimiento_batch(detalle, total_bs, detalles_extra=None):
    try:
        detalles_json = json.dumps(detalles_extra, ensure_ascii=False) if detalles_extra else None
        _ejecutar_consulta(
            '''INSERT INTO movimientos (detalle, total_bs, detalles_extra)
                VALUES (?, ?, ?)''',
            (detalle, total_bs, detalles_json),
            commit=True
        )
        return True
    except Exception as e:
        print(f"Error registrando movimiento: {e}")
        return False

def obtener_movimientos():
    try:
        cursor = _ejecutar_consulta('''
            SELECT fecha, detalle, total_bs, detalles_extra
            FROM movimientos
            ORDER BY fecha DESC
        ''')
        return cursor.fetchall()
    except Exception as e:
        print(f"Error obteniendo movimientos: {e}")
        return []

def eliminar_movimiento(fecha):
    try:
        cursor = _ejecutar_consulta(
            'DELETE FROM movimientos WHERE fecha = ?',
            (fecha,),
            commit=True
        )
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Error eliminando movimiento: {e}")
        return False

# Operaciones para ventas
def registrar_venta(producto, cantidad, precio):
    """Registra una venta en la tabla ventas"""
    try:
        _ejecutar_consulta(
            '''INSERT INTO ventas (producto, cantidad, precio) VALUES (?, ?, ?)''',
            (producto, cantidad, precio),
            commit=True
        )
        return True
    except Exception as e:
        print(f"Error registrando venta: {e}")
        return False

def obtener_ventas():
    """Obtiene todas las ventas registradas"""
    try:
        cursor = _ejecutar_consulta('SELECT * FROM ventas ORDER BY fecha DESC')
        return cursor.fetchall()
    except Exception as e:
        print(f"Error obteniendo ventas: {e}")
        return []

# Operaciones para tasa de dólar
def obtener_tasa_dolar():
    """Obtiene la tasa de dólar más reciente"""
    try:
        cursor, conn = _ejecutar_consulta('''
            SELECT monto FROM tasa_dolar
            ORDER BY fecha DESC LIMIT 1
        ''')
        tasa = cursor.fetchone()
        conn.close()
        return tasa['monto'] if tasa else 36.0
    except Exception as e:
        print(f"Error obteniendo tasa dólar: {e}")
        return 36.0

def actualizar_tasa_dolar(monto):
    try:
        _ejecutar_consulta(
            'INSERT INTO tasa_dolar (monto) VALUES (?)',
            (monto,),
            commit=True
        )
        return True
    except Exception as e:
        print(f"Error actualizando tasa dólar: {e}")
        return False