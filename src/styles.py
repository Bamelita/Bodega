# src/styles.py
"""
Módulo de estilos mejorado para BodegaApp
Diseño moderno con enfoque en usabilidad y estética
"""

from tkinter import ttk
from typing import Dict, Tuple

# Paleta de colores profesional y elegante
COLOR_PALETTE = {
    "primary": "#D1D5DB",         # Gris azulado oscuro (base principal)
    "secondary": "#374151",       # Gris pizarra (para contrastes suaves)
    "accent": "#2563EB",          # Azul profesional (acciones primarias)
    "accent_dark": "#1E40AF",     # Azul oscuro (hover o estados activos)
    "text": "#F9FAFB",            # Gris casi blanco (texto claro)
    "text_secondary": "#D1D5DB",  # Gris claro (texto secundario)
    "warning": "#DC2626",         # Rojo serio (advertencias)
    "warning_dark": "#991B1B",    # Rojo oscuro (errores críticos)
    "success": "#16A34A",         # Verde confiable (éxito/confirmaciones)
    "entry_bg": "#111827",        # Azul grisáceo oscuro (fondo de inputs)
    "selected": "#1E3A8A",        # Azul marino (elemento seleccionado)
    "disabled": "#6B7280",        # Gris neutro (elementos deshabilitados)
    "header_bg": "#0F172A",       # Azul profundo (cabeceras y navbar)
    "border": "#334155",          # Gris azulado medio (bordes sutiles)
    "fondo": "#0D1117",           # Negro azulado (fondo general)
    "hover": "#3B82F6"            # Azul claro (hover en botones)
}

# Configuración tipográfica moderna
FONT_CONFIG = {
    "title": ("Segoe UI Semibold", 18),
    "subtitle": ("Segoe UI", 14, "bold"),
    "header": ("Segoe UI Semibold", 11),
    "normal": ("Segoe UI", 11),
    "small": ("Segoe UI", 10),
    "fixed": ("Consolas", 10)
}

def configurar_estilos():
    style = ttk.Style()
    style.theme_use('clam')

    # Configuración global
    style.configure('.',
        background=COLOR_PALETTE["fondo"],
        foreground=COLOR_PALETTE["text"],
        font=FONT_CONFIG["normal"]
    )

    # Labels
    style.configure("TLabel", font=FONT_CONFIG["normal"], background=COLOR_PALETTE["fondo"])
    style.configure("title.TLabel",
        font=FONT_CONFIG["title"],
        foreground=COLOR_PALETTE["primary"],
        padding=8,
        background=COLOR_PALETTE["fondo"]
    )
    style.configure("header.TLabel",
        font=FONT_CONFIG["header"],
        foreground=COLOR_PALETTE["text_secondary"],
        padding=6,
        background=COLOR_PALETTE["header_bg"]
    )

    # Summary Cards
    style.configure("SummaryCard.TFrame",
        background=COLOR_PALETTE["header_bg"],
        borderwidth=2,
        relief="groove"
    )
    style.configure("SummaryCardTitle.TLabel",
        font=("Segoe UI", 10, "bold"),
        foreground=COLOR_PALETTE["text_secondary"],
        background=COLOR_PALETTE["header_bg"]
    )
    style.configure("SummaryCardValue.TLabel",
        font=("Segoe UI", 16, "bold"),
        foreground=COLOR_PALETTE["accent"],
        background=COLOR_PALETTE["header_bg"]
    )

    # Botones modernos
    style.configure("TButton",
        padding=10,
        relief="flat",
        borderwidth=0,
        font=FONT_CONFIG["header"],
        focusthickness=0,
        focuscolor='none',
        background=COLOR_PALETTE["primary"],
        foreground=COLOR_PALETTE["secondary"]
    )
    style.map("TButton",
        background=[("active", COLOR_PALETTE["hover"]), ("disabled", COLOR_PALETTE["disabled"])],
        foreground=[("active", COLOR_PALETTE["text"]), ("disabled", COLOR_PALETTE["text_secondary"])],
        relief=[("pressed", "sunken")]
    )

    style.configure("Accent.TButton",
        background=COLOR_PALETTE["accent"],
        foreground="white",
        borderwidth=0,
        bordercolor=COLOR_PALETTE["accent_dark"],
        padding=10
    )
    style.map("Accent.TButton",
        background=[("active", COLOR_PALETTE["accent_dark"]), ("disabled", COLOR_PALETTE["disabled"])],
        foreground=[("active", "white"), ("disabled", COLOR_PALETTE["text_secondary"])],
        relief=[("pressed", "sunken")]
    )

    style.configure("Warning.TButton",
        background=COLOR_PALETTE["warning"],
        foreground="white",
        borderwidth=0,
        bordercolor=COLOR_PALETTE["warning_dark"],
        padding=10
    )
    style.map("Warning.TButton",
        background=[("active", COLOR_PALETTE["warning_dark"]), ("disabled", COLOR_PALETTE["disabled"])],
        foreground=[("active", "white"), ("disabled", COLOR_PALETTE["text_secondary"])]
    )

    # Entradas de texto modernas
    style.configure("TEntry",
        fieldbackground=COLOR_PALETTE["entry_bg"],
        bordercolor=COLOR_PALETTE["border"],
        borderwidth=2,
        relief="flat",
        padding=(10, 8),
        font=FONT_CONFIG["normal"],
        foreground=COLOR_PALETTE["text"]
    )
    style.map("TEntry",
        bordercolor=[("focus", COLOR_PALETTE["accent"])],
        fieldbackground=[("disabled", COLOR_PALETTE["disabled"])]
    )

    # Spinbox
    style.configure("TSpinbox",
        arrowsize=16,
        padding=(10, 8, 28, 8),
        fieldbackground=COLOR_PALETTE["entry_bg"],
        bordercolor=COLOR_PALETTE["border"],
        borderwidth=2,
        relief="flat",
        font=FONT_CONFIG["normal"],
        foreground=COLOR_PALETTE["text"]
    )
    style.map("TSpinbox",
        bordercolor=[("focus", COLOR_PALETTE["accent"])]
    )

    # Tablas (Treeview)
    style.configure("Treeview",
        background=COLOR_PALETTE["fondo"],
        fieldbackground=COLOR_PALETTE["fondo"],
        rowheight=36,
        borderwidth=0,
        font=FONT_CONFIG["small"],
        relief="flat"
    )
    style.map("Treeview",
        background=[("selected", COLOR_PALETTE["selected"])],
        foreground=[("selected", COLOR_PALETTE["text"])]
    )

    # Cabeceras de tablas
    style.configure("Treeview.Heading",
        background=COLOR_PALETTE["header_bg"],
        foreground=COLOR_PALETTE["text_secondary"],
        font=FONT_CONFIG["header"],
        padding=12,
        relief="flat",
        anchor="center"
    )
    style.map("Treeview.Heading",
        background=[("active", COLOR_PALETTE["hover"])]
    )

    # Scrollbars modernas
    style.configure("Vertical.TScrollbar",
        troughcolor=COLOR_PALETTE["fondo"],
        background=COLOR_PALETTE["border"],
        bordercolor=COLOR_PALETTE["fondo"],
        arrowsize=16,
        width=14,
        relief="flat"
    )
    style.map("Vertical.TScrollbar",
        background=[("active", COLOR_PALETTE["accent"])]
    )

    style.configure("Horizontal.TScrollbar",
        troughcolor=COLOR_PALETTE["fondo"],
        background=COLOR_PALETTE["border"],
        width=14,
        relief="flat"
    )

    # Frames con bordes sutiles y redondeados
    style.configure("TFrame",
        background=COLOR_PALETTE["fondo"],
        bordercolor=COLOR_PALETTE["border"],
        borderwidth=1,
        relief="flat"
    )

    # PanedWindow
    style.configure("TPanedwindow",
        background=COLOR_PALETTE["border"],
        sashwidth=10,
        sashpad=3
    )

def aplicar_estilo_ventana(ventana) -> None:
    """Aplica estilos adicionales a la ventana principal"""
    ventana.configure(bg=COLOR_PALETTE["fondo"])
    
    # Configuración de combobox
    ventana.option_add('*TCombobox*Listbox.font', FONT_CONFIG["small"])
    ventana.option_add('*TCombobox*Listbox.background', COLOR_PALETTE["fondo"])
    ventana.option_add('*TCombobox*Listbox.foreground', COLOR_PALETTE["text"])
    ventana.option_add('*TCombobox*Listbox.selectBackground', COLOR_PALETTE["selected"])
    
    # Efectos de hover
    ventana.option_add('*TButton*highlightBackground', COLOR_PALETTE["fondo"])
    ventana.option_add('*TButton*highlightColor', COLOR_PALETTE["fondo"])