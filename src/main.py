# src/main.py
import os
import tkinter as tk
from tkinter import messagebox
import logging
from database import crear_tablas
from main_window import BodegaApp
from styles import configurar_estilos, aplicar_estilo_ventana
import sys
import platform

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='data/app.log',
    encoding='utf-8'
)

logger = logging.getLogger(__name__)

def cargar_icono(root):
    """Intenta cargar el ícono con manejo de errores"""
    try:
        ruta_icono = os.path.join('assets', 'icon.png')
        
        # Verificar si el archivo existe
        if not os.path.exists(ruta_icono):
            logger.warning("Archivo de ícono no encontrado: %s", ruta_icono)
            return
        
        # Cargar y asignar el ícono
        icono = tk.PhotoImage(file=ruta_icono)
        root.iconphoto(True, icono)
        logger.info("Ícono cargado correctamente")
        
    except Exception as e:
        logger.error("Error cargando el ícono: %s", str(e))

def iniciar_interfaz():
    """Inicializa y ejecuta la interfaz gráfica"""
    try:
        root = tk.Tk()
        root.tk.call('tk', 'scaling', 1.5)
        
        # Configurar estilos
        configurar_estilos()
        aplicar_estilo_ventana(root)
        
        # Cargar ícono
        cargar_icono(root)
        
        # Inicializar aplicación
        app = BodegaApp(root)
        root.mainloop()
        
    except Exception as e:
        logger.critical("Error en la interfaz gráfica: %s", str(e), exc_info=True)
        if 'root' in locals() and root.winfo_exists():
            messagebox.showerror(
                "Error Fatal", 
                f"La aplicación debe cerrarse:\n{str(e)}"
            )
        sys.exit(1)

def main():
    """Función principal de la aplicación"""
    try:
        iniciar_interfaz()
    except Exception as e:
        messagebox.showerror(
            "Error de Inicio", 
            f"No se pudo iniciar la aplicación:\n{str(e)}\n\nVer logs para más detalles."
        )
        sys.exit(1)

if __name__ == "__main__":
    main()