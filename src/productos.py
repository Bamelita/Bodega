# src/productos.py
import logging
from database import conectar_db
import sqlite3

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='data/app.log',
    encoding='utf-8'
)

def _validar_datos_producto(precio, stock, stock_minimo):
    """Valida los datos básicos de un producto"""
    if any(not isinstance(valor, (int, float)) or valor < 0 
           for valor in [precio, stock, stock_minimo]):
        logging.warning("Datos numéricos inválidos")
        return False
    return True

def agregar_producto(codigo, nombre, descripcion, precio, stock, stock_minimo):
    """
    Agrega un nuevo producto a la base de datos.
    
    Args:
        codigo (str): Código único (8 caracteres)
        nombre (str): Nombre del producto (no vacío)
        descripcion (str): Descripción opcional
        precio (float): Precio positivo
        stock (int): Stock inicial no negativo
        stock_minimo (int): Mínimo stock no negativo
    
    Returns:
        bool: True si la operación fue exitosa
    """
    try:
        if not _validar_datos_producto(precio, stock, stock_minimo):
            return False
            
        if not codigo or len(codigo) != 8 or not nombre.strip():
            logging.error("Código/nombre inválido")
            return False

        with conectar_db() as conn:
            conn.execute('''
                INSERT INTO productos 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (codigo, nombre.strip(), descripcion.strip(), 
                 precio, stock, stock_minimo))
            conn.commit()
            
        logging.info(f"Producto agregado: {nombre} ({codigo})")
        return True
        
    except sqlite3.IntegrityError:
        logging.warning(f"Código duplicado: {codigo}")
        return False
    except Exception as e:
        logging.error(f"Error agregando producto {codigo}: {str(e)}")
        return False

def obtener_productos(filtro=None):
    """
    Obtiene productos con opción de filtrar por nombre/descripción
    
    Args:
        filtro (str, optional): Texto para buscar
    
    Returns:
        list: Lista de productos ordenados por nombre
    """
    try:
        query = '''
            SELECT codigo, nombre, descripcion, precio, stock, stock_minimo
            FROM productos
        '''
        params = ()
        
        if filtro and filtro.strip():
            query += " WHERE nombre LIKE ? OR descripcion LIKE ?"
            params = (f'%{filtro.strip()}%', f'%{filtro.strip()}%')
            
        query += " ORDER BY nombre COLLATE NOCASE"
        
        with conectar_db() as conn:
            return conn.execute(query, params).fetchall()
            
    except Exception as e:
        logging.error(f"Error obteniendo productos: {str(e)}")
        return []

def obtener_producto_por_codigo(codigo):
    """
    Obtiene un producto por su código único
    
    Args:
        codigo (str): Código de 8 caracteres
    
    Returns:
        sqlite3.Row: Objeto con los datos del producto o None
    """
    try:
        with conectar_db() as conn:
            return conn.execute(
                "SELECT * FROM productos WHERE codigo = ?",
                (codigo,)
            ).fetchone()
    except Exception as e:
        logging.error(f"Error buscando producto {codigo}: {str(e)}")
        return None

def actualizar_producto(codigo, nombre, descripcion, precio, stock, stock_minimo):
    """
    Actualiza los datos de un producto existente
    
    Args:
        codigo (str): Código existente (8 caracteres)
        nombre (str): Nuevo nombre
        descripcion (str): Nueva descripción
        precio (float): Nuevo precio
        stock (int): Nuevo stock
        stock_minimo (int): Nuevo mínimo
    
    Returns:
        bool: True si se actualizó correctamente
    """
    try:
        if not _validar_datos_producto(precio, stock, stock_minimo):
            return False

        with conectar_db() as conn:
            cursor = conn.execute('''
                UPDATE productos SET
                    nombre = ?,
                    descripcion = ?,
                    precio = ?,
                    stock = ?,
                    stock_minimo = ?
                WHERE codigo = ?
            ''', (nombre.strip(), descripcion.strip(), 
                 precio, stock, stock_minimo, codigo))
            
            conn.commit()
            
            if cursor.rowcount == 0:
                logging.warning(f"Producto no encontrado: {codigo}")
                return False
                
        logging.info(f"Producto actualizado: {codigo}")
        return True
        
    except Exception as e:
        logging.error(f"Error actualizando producto {codigo}: {str(e)}")
        return False

def eliminar_producto(codigo):
    """
    Elimina un producto de la base de datos
    
    Args:
        codigo (str): Código del producto a eliminar
    
    Returns:
        bool: True si se eliminó correctamente
    """
    try:
        with conectar_db() as conn:
            # Obtener nombre antes de eliminar
            producto = conn.execute(
                "SELECT nombre FROM productos WHERE codigo = ?",
                (codigo,)
            ).fetchone()
            
            cursor = conn.execute(
                "DELETE FROM productos WHERE codigo = ?",
                (codigo,)
            )
            conn.commit()
            
            if cursor.rowcount > 0:
                nombre = producto['nombre'] if producto else 'Desconocido'
                logging.info(f"Producto eliminado: {nombre} ({codigo})")
                return True
                
        logging.warning(f"Producto no encontrado: {codigo}")
        return False
        
    except Exception as e:
        logging.error(f"Error eliminando producto {codigo}: {str(e)}")
        return False