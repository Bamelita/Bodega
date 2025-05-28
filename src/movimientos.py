# src/movimientos.py

import json
import logging
import sqlite3
from database import conectar_db

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='data/app.log',
    encoding='utf-8'
)

def registrar_movimiento(detalle, total_bs, detalles_extra=None):
    """
    Registra un movimiento en la base de datos.
    
    Args:
        detalle (str): Nombre del producto o descripción.
        total_bs (float): Monto total en Bs.
        detalles_extra (dict, optional): {
            'producto_id': str,
            'cantidad': int,
            'cliente': str (opcional)
        }  para venta individual, o
        {
            'productos': [
                {'producto_id':..., 'cantidad':...}, ...
            ]
        }  para lote.
    Returns:
        bool: True si se registró correctamente.
    """
    if not detalle or total_bs <= 0:
        logging.warning("Datos inválidos al registrar movimiento.")
        return False

    try:
        detalles_json = json.dumps(detalles_extra, ensure_ascii=False) if detalles_extra else None
        with conectar_db() as conn:
            conn.execute(
                "INSERT INTO movimientos (detalle, total_bs, detalles_extra) VALUES (?, ?, ?)",
                (detalle, total_bs, detalles_json)
            )
            conn.commit()
        logging.info(f"Movimiento registrado: {detalle} - {total_bs:.2f} Bs.")
        return True

    except (sqlite3.Error, json.JSONDecodeError) as e:
        logging.error(f"Error al registrar movimiento: {e}")
        return False
    except Exception as e:
        logging.error(f"Error inesperado: {e}")
        return False

def obtener_movimientos(limite=None):
    """
    Obtiene los movimientos ordenados por fecha DESC.
    """
    try:
        with conectar_db() as conn:
            query = "SELECT fecha, detalle, total_bs, detalles_extra FROM movimientos ORDER BY fecha DESC"
            if limite:
                query += f" LIMIT {int(limite)}"
            cursor = conn.execute(query)
            return cursor.fetchall()
    except sqlite3.Error as e:
        logging.error(f"Error al obtener movimientos: {e}")
        return []

def eliminar_movimiento(fecha):
    """
    Elimina un movimiento por su fecha y revierte el stock según detalles_extra.
    
    Args:
        fecha (str): Fecha ISO del movimiento.
    Returns:
        bool: True si se eliminó correctamente.
    """
    try:
        with conectar_db() as conn:
            # Leer detalles_extra
            cur = conn.execute("SELECT detalles_extra FROM movimientos WHERE fecha = ?", (fecha,))
            fila = cur.fetchone()
            if not fila:
                logging.warning(f"No encontrado movimiento {fecha}")
                return False

            detalles_json = fila[0]
            if detalles_json:
                det = json.loads(detalles_json)
                # Venta individual
                if det.get("producto_id"):
                    conn.execute(
                        "UPDATE productos SET stock = stock + ? WHERE codigo = ?",
                        (det.get("cantidad", 0), det["producto_id"])
                    )
                # Venta por lote
                elif det.get("productos"):
                    for item in det["productos"]:
                        conn.execute(
                            "UPDATE productos SET stock = stock + ? WHERE codigo = ?",
                            (item.get("cantidad", 0), item["producto_id"])
                        )

            # Eliminar el movimiento
            conn.execute("DELETE FROM movimientos WHERE fecha = ?", (fecha,))
            conn.commit()
        logging.info(f"Movimiento eliminado y stock revertido: {fecha}")
        return True

    except (sqlite3.Error, json.JSONDecodeError) as e:
        logging.error(f"Error al eliminar movimiento: {e}")
        return False
    except Exception as e:
        logging.error(f"Error inesperado al eliminar movimiento: {e}")
        return False