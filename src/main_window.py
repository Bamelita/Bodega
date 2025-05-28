import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
from styles import configurar_estilos, COLOR_PALETTE
from productos import (
    agregar_producto,
    obtener_productos,
    obtener_producto_por_codigo,
    actualizar_producto,
    eliminar_producto
)
from movimientos import (
    registrar_movimiento,
    obtener_movimientos,
    eliminar_movimiento
)
from database import crear_tablas, obtener_tasa_dolar, actualizar_tasa_dolar, conectar_db
import uuid
import pandas as pd
from datetime import datetime, timedelta
from tkinter import filedialog
import matplotlib
matplotlib.use('TkAgg')
from matplotlib import pyplot as plt

class BodegaApp:
    """Clase principal de la aplicación de gestión de bodega."""

    def __init__(self, root):
        self.root = root
        self.root.title("🗄️ Bodega Central")
        self.root.geometry("1300x720")
        self.root.resizable(True, True)

        # Configuración inicial
        configurar_estilos()
        crear_tablas()

        # Variable para mostrar la tasa en el header
        self.tasa_var = tk.StringVar()
        self._load_tasa()

        self._setup_ui()
        self._bind_shortcuts()
        self.refresh_tables()

    def _bind_shortcuts(self):
        """Atajos de teclado."""
        self.root.bind("<Control-n>", lambda e: self.open_prod_form())
        self.root.bind("<Escape>", lambda e: self.root.attributes('-fullscreen', False))

    def _load_tasa(self):
        """Carga la tasa actual en self.tasa_var."""
        try:
            t = obtener_tasa_dolar()
            self.tasa_var.set(f"USD: {t:.2f} Bs.")
        except:
            self.tasa_var.set("USD: -- Bs.")
            messagebox.showerror("Error", "No se pudo cargar la tasa de dólar")
            self.root.after(1000, self._load_tasa)
            return

    def configurar_estilos(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configuración global
        style.configure('.', 
                    background=COLOR_PALETTE["fondo"],
                    foreground=COLOR_PALETTE["text"],
                    font=("Segoe UI", 11),
                    borderwidth=1,
                    relief="flat")
        
        # Cabeceras y títulos
        style.configure("TLabel",
                    padding=8,
                    background=COLOR_PALETTE["header_bg"])
        style.configure("title.TLabel",
                    font=("Segoe UI", 18, "bold"),
                    foreground=COLOR_PALETTE["accent"],
                    background=COLOR_PALETTE["fondo"])
        style.configure("header.TLabel",
                    font=("Segoe UI", 12, "bold"),
                    foreground=COLOR_PALETTE["text_secondary"])
        
        # Botones
        style.configure("TButton",
                    padding=10,
                    relief="flat",
                    borderwidth=0)
        style.configure("Accent.TButton",
                    background=COLOR_PALETTE["accent"],
                    foreground="white",
                    font=("Segoe UI", 11, "bold"))
        style.map("Accent.TButton",
                background=[("active", COLOR_PALETTE["accent_dark"]),
                            ("disabled", COLOR_PALETTE["disabled"])])
        
        style.configure("Warning.TButton",
                    background=COLOR_PALETTE["warning"],
                    foreground="white",
                    font=("Segoe UI", 11, "bold"))
        style.map("Warning.TButton",
                background=[("active", COLOR_PALETTE["warning_dark"]),
                            ("disabled", COLOR_PALETTE["disabled"])])
        
        # Campos de entrada y combobox
        style.configure("TEntry",
                    fieldbackground=COLOR_PALETTE["entry_bg"],
                    foreground=COLOR_PALETTE["text"],
                    bordercolor=COLOR_PALETTE["border"],
                    insertcolor=COLOR_PALETTE["text"],
                    relief="solid")
        
        style.configure("TCombobox",
                    fieldbackground=COLOR_PALETTE["entry_bg"],
                    selectbackground=COLOR_PALETTE["selected"],
                    arrowsize=14)
        style.map("TCombobox",
                fieldbackground=[("readonly", COLOR_PALETTE["entry_bg"])])
        
        # Tablas (Treeview)
        style.configure("Treeview",
                    background=COLOR_PALETTE["entry_bg"],
                    fieldbackground=COLOR_PALETTE["entry_bg"],
                    foreground=COLOR_PALETTE["text"],
                    rowheight=35,
                    borderwidth=0)
        style.map("Treeview",
                background=[("selected", COLOR_PALETTE["selected"])])
        
        style.configure("Treeview.Heading",
                    background=COLOR_PALETTE["header_bg"],
                    foreground=COLOR_PALETTE["text_secondary"],
                    font=("Segoe UI", 11, "bold"),
                    relief="flat",
                    padding=10)
        
        # Scrollbars
        style.configure("Vertical.TScrollbar",
                    troughcolor=COLOR_PALETTE["fondo"],
                    background=COLOR_PALETTE["border"],
                    bordercolor=COLOR_PALETTE["fondo"],
                    arrowsize=14,
                    width=12)
        style.map("Vertical.TScrollbar",
                background=[("active", COLOR_PALETTE["accent"])])
        
        style.configure("Horizontal.TScrollbar",
                    troughcolor=COLOR_PALETTE["fondo"],
                    background=COLOR_PALETTE["border"],
                    width=12)
        
        # Tarjetas y paneles
        style.configure("SummaryCard.TFrame",
                    background=COLOR_PALETTE["header_bg"],
                    borderwidth=2,
                    bordercolor=COLOR_PALETTE["border"])
        style.configure("SummaryCardTitle.TLabel",
                    foreground=COLOR_PALETTE["text_secondary"],
                    font=("Segoe UI", 10))
        style.configure("SummaryCardValue.TLabel",
                    foreground=COLOR_PALETTE["accent"],
                    font=("Segoe UI", 14, "bold"))
        
        # Notificaciones y alertas
        style.configure("Notification.Info.TLabel",
                    background=COLOR_PALETTE["secondary"],
                    foreground=COLOR_PALETTE["text"],
                    padding=10)
        
        style.configure("Notification.Warning.TLabel",
                    background=COLOR_PALETTE["warning"],
                    foreground="white",
                    padding=10)
        
        # Estado deshabilitado
        style.map("TEntry",
                fieldbackground=[("disabled", COLOR_PALETTE["disabled"])])
        style.map("TButton",
                foreground=[("disabled", COLOR_PALETTE["text_secondary"])])

    def obtener_ganancias_por_periodo(self, periodo):
        fecha_hoy = datetime.now()
        
        if periodo == 'dia':
            fecha_inicio = fecha_hoy.replace(hour=0, minute=0, second=0, microsecond=0)
            fecha_fin = fecha_hoy.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif periodo == 'semana':
            fecha_inicio = fecha_hoy - timedelta(days=fecha_hoy.weekday())
            fecha_inicio = fecha_inicio.replace(hour=0, minute=0, second=0, microsecond=0)
            fecha_fin = fecha_inicio + timedelta(days=6, hours=23, minutes=59, seconds=59, microseconds=999999)
        elif periodo == 'mes':
            fecha_inicio = fecha_hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if fecha_hoy.month == 12:
                fecha_fin = fecha_hoy.replace(year=fecha_hoy.year + 1, month=1, day=1) - timedelta(seconds=1)
            else:
                fecha_fin = fecha_hoy.replace(month=fecha_hoy.month + 1, day=1) - timedelta(seconds=1)
        else:
            return 0.0
        
        with conectar_db() as conn:
            cursor = conn.execute(''' 
                SELECT SUM(precio * cantidad) 
                FROM ventas 
                WHERE fecha >= ? AND fecha <= ?
            ''', (fecha_inicio, fecha_fin))
            resultado = cursor.fetchone()
            return resultado[0] if resultado[0] else 0.0
        
    def generar_graficos(self):
        import matplotlib
        matplotlib.use('TkAgg')
        from matplotlib import pyplot as plt
        
        # Primera figura
        fig1 = plt.figure(figsize=(8, 6))
        periodos = ['Día', 'Semana', 'Mes']
        ganancias = [
            self.obtener_ganancias_por_periodo('dia'),
            self.obtener_ganancias_por_periodo('semana'), 
            self.obtener_ganancias_por_periodo('mes')
        ]
        
        plt.bar(periodos, ganancias, color=COLOR_PALETTE["accent"])
        plt.title('Ganancias por Periodo')
        plt.xlabel('Periodo')
        plt.ylabel('Ganancia en $')
        plt.tight_layout()
        
        # Segunda figura
        fig2 = plt.figure(figsize=(8, 6))
        with conectar_db() as conn:
            ventas = conn.execute('''
                SELECT producto, SUM(cantidad * precio) AS total_ventas
                FROM ventas
                GROUP BY producto
            ''').fetchall()
        
        productos = [venta[0] for venta in ventas]
        totales = [venta[1] for venta in ventas]
        
        plt.barh(productos, totales, color=COLOR_PALETTE["accent_dark"])
        plt.title('Ventas por Producto')
        plt.xlabel('Ventas Totales ($)')
        plt.ylabel('Producto')
        plt.tight_layout()

        # Manejo de cierre
        def cerrar_graficos(event):
            plt.close('all')
            self.root.focus_force()
        
        fig1.canvas.mpl_connect('close_event', cerrar_graficos)
        fig2.canvas.mpl_connect('close_event', cerrar_graficos)
        
        plt.show()
        
    def generar_grafico_ventas_por_producto(self):
        import matplotlib
        matplotlib.use('TkAgg')
        from matplotlib import pyplot as plt
        
        fig = plt.figure(figsize=(8, 6))
        with conectar_db() as conn:
            ventas = conn.execute('''
                SELECT producto, SUM(cantidad * precio) AS total_ventas
                FROM ventas
                GROUP BY producto
            ''').fetchall()

        productos = [venta[0] for venta in ventas]
        totales = [venta[1] for venta in ventas]

        plt.figure(figsize=(8, 6))
        plt.barh(productos, totales, color=COLOR_PALETTE["accent_dark"])
        plt.title('Ventas por Producto')
        plt.xlabel('Ventas Totales ($)')
        plt.ylabel('Producto')
        plt.tight_layout()
        plt.show()
    
        def on_close(event):
            plt.close(fig)
            self.root.focus_force()
        
        fig.canvas.mpl_connect('close_event', on_close)
        plt.show()

    def exportar_a_excel(self):
        try:
            with conectar_db() as conn:
                ventas = conn.execute('SELECT producto, cantidad, precio, fecha FROM ventas').fetchall()
            
            columnas = ['Producto', 'Cantidad', 'Precio', 'Fecha']
            df_ventas = pd.DataFrame(ventas, columns=columnas)
            df_ventas['Fecha'] = pd.to_datetime(df_ventas['Fecha'])

            df_ganancias = pd.DataFrame({
                'Periodo': ['Día', 'Semana', 'Mes'],
                'Ganancia': [
                    self.obtener_ganancias_por_periodo('dia'),
                    self.obtener_ganancias_por_periodo('semana'),
                    self.obtener_ganancias_por_periodo('mes')
                ]
            })

            archivo_excel = filedialog.asksaveasfilename(
                defaultextension=".xlsx",
                filetypes=[("Archivos de Excel", "*.xlsx")]
            )
            if archivo_excel:
                with pd.ExcelWriter(archivo_excel, engine='openpyxl') as writer:
                    df_ventas.to_excel(writer, sheet_name='Reporte', index=False, startrow=0)
                    df_ganancias.to_excel(writer, sheet_name='Reporte', startrow=len(df_ventas) + 5, index=False)
                messagebox.showinfo("Éxito", "Datos exportados correctamente", icon='info')
            else:
                messagebox.showwarning("Advertencia", "No se seleccionó archivo", icon='warning')
        
        except Exception as e:
            messagebox.showerror("Error", f"Ocurrió un error: {str(e)}", icon='error')

    def _setup_ui(self):
        """Construye la UI principal."""
        header = ttk.Frame(self.root)
        header.pack(fill="x", pady=10, padx=10)
        ttk.Label(header, text="Gestión de Inventario", style="title.TLabel").pack(side="left")
        ttk.Label(header, textvariable=self.tasa_var, style="header.TLabel").pack(side="right")
        
        paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)
        paned.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self._setup_productos_ui(paned)
        self._setup_movimientos_ui(paned)
        self._setup_footer()

    def _setup_productos_ui(self, paned):
        frame = ttk.Labelframe(paned, text="Productos", padding=10)
        paned.add(frame, weight=1)
        frame.grid_rowconfigure(1, weight=1)
        frame.grid_columnconfigure(0, weight=1)

        # Búsqueda
        prod_search = ttk.Frame(frame)
        prod_search.grid(row=0, column=0, sticky="ew", pady=(0,5))
        ttk.Label(prod_search, text="Buscar:", style="bold.TLabel").pack(side="left")
        self.prod_search_var = tk.StringVar()
        ttk.Entry(prod_search, textvariable=self.prod_search_var)\
            .pack(side="left", fill="x", expand=True, padx=5)
        ttk.Button(prod_search, text="×", style="Warning.TButton",
                   command=lambda: self.prod_search_var.set("")).pack(side="left")
        self.prod_search_var.trace_add("write", lambda *a: self._refresh_productos())

        # Tabla de productos
        cols = ("Código","Nombre","Descripción","Precio","Stock","Mínimo")
        self.prod_table = ttk.Treeview(frame, columns=cols, show="headings",
                                       selectmode="browse", style="Custom.Treeview")
        for c,w in zip(cols,(100,100,100,80,80,80)):
            self.prod_table.heading(c, text=c)
            self.prod_table.column(c, width=w, anchor="center")
        self.prod_table.grid(row=1, column=0, sticky="nsew")
        self.prod_table.bind("<<TreeviewSelect>>", self._on_prod_select)
        vsb1 = ttk.Scrollbar(frame, orient="vertical", command=self.prod_table.yview)
        self.prod_table.configure(yscrollcommand=vsb1.set)
        vsb1.grid(row=1, column=1, sticky="ns")

        # Configuración de estilos de la tabla
        self.prod_table.tag_configure('even', background=COLOR_PALETTE["hover"])
        self.prod_table.tag_configure("bajo_stock", background=COLOR_PALETTE["warning"])

    def _setup_movimientos_ui(self, paned):
        frame = ttk.Labelframe(paned, text="Movimientos", padding=10)
        paned.add(frame, weight=1)
        frame.grid_rowconfigure(0, weight=1)
        frame.grid_columnconfigure(0, weight=1)

        cols = ("Fecha","Producto","Cantidad","Total","Cliente")
        self.mov_table = ttk.Treeview(frame, columns=cols, show="headings",
                                      selectmode="browse", style="Custom.Treeview")
        for c,w in zip(cols,(100,100,80,80,100)):
            self.mov_table.heading(c, text=c)
            self.mov_table.column(c, width=w, anchor="center")
        self.mov_table.grid(row=0, column=0, sticky="nsew")
        self.mov_table.bind("<<TreeviewSelect>>", self._on_mov_select)
        vsb2 = ttk.Scrollbar(frame, orient="vertical", command=self.mov_table.yview)
        self.mov_table.configure(yscrollcommand=vsb2.set)
        vsb2.grid(row=0, column=1, sticky="ns")

        self.ganancias_label = ttk.Label(
            frame, text="Ganancias Totales: 0.00 Bs.", style="header.TLabel"
        )
        self.ganancias_label.grid(row=1, column=0, sticky="e", pady=5)

    def _setup_footer(self):
        footer = ttk.Frame(self.root)
        footer.pack(fill="x", padx=10, pady=10)
        main_container = ttk.Frame(footer)
        main_container.pack(expand=True)

        # Grupo 1: Gestión de Productos
        product_frame = ttk.Frame(main_container)
        product_frame.grid(row=0, column=0, padx=5, pady=2, sticky="w")
        
        btn_new = ttk.Button(
            product_frame, 
            text="➕ Nuevo Producto", 
            command=self.open_prod_form, 
            style="Accent.TButton"
        )
        btn_new.pack(side="left", padx=2)
        
        self.btn_mod_prod = ttk.Button(
            product_frame, 
            text="✏️ Modificar", 
            command=self.open_mod_prod_form, 
            state="disabled"
        )
        self.btn_mod_prod.pack(side="left", padx=2)
        
        self.btn_del_prod = ttk.Button(
            product_frame, 
            text="🗑️ Eliminar Producto", 
            command=self.confirm_delete_prod, 
            style="Warning.TButton", 
            state="disabled"
        )
        self.btn_del_prod.pack(side="left", padx=2)

        # Grupo 2: Operaciones de Venta
        sales_frame = ttk.Frame(main_container)
        sales_frame.grid(row=0, column=1, padx=5, pady=2, sticky="w")
        
        ttk.Button(
            sales_frame, 
            text="💰 Venta Rápida", 
            command=self.open_single_sale, 
            style="Accent.TButton"
        ).pack(side="left", padx=2)
        
        ttk.Button(
            sales_frame, 
            text="📦 Venta por Lote", 
            command=self.open_batch_sale, 
            style="Accent.TButton"
        ).pack(side="left", padx=2)

        # Grupo 3: Configuración y Datos
        config_frame = ttk.Frame(main_container)
        config_frame.grid(row=0, column=2, padx=5, pady=2, sticky="w")
        
        ttk.Button(
            config_frame, 
            text="💲 Tasa Dólar", 
            command=self.verificar_o_modificar_tasa
        ).pack(side="left", padx=2)
        
        ttk.Button(
            config_frame, 
            text="🔄 Refrescar", 
            command=self.refresh_tables
        ).pack(side="left", padx=2)

        # Grupo 4: Gestión de Movimientos
        mov_frame = ttk.Frame(main_container)
        mov_frame.grid(row=1, column=0, padx=5, pady=2, sticky="w")
        
        self.btn_del_mov = ttk.Button(
            mov_frame, 
            text="🗑️ Eliminar Movimiento", 
            command=self.confirm_delete_mov, 
            style="Warning.TButton", 
            state="disabled"
        )
        self.btn_del_mov.pack(side="left", padx=2)

        # Grupo 5: Reportes y Exportación
        reports_frame = ttk.Frame(main_container)
        reports_frame.grid(row=1, column=1, columnspan=2, padx=5, pady=2, sticky="e")
        
        ttk.Button(
            reports_frame, 
            text="📊 Exportar Excel", 
            command=self.exportar_a_excel, 
            style="Accent.TButton"
        ).pack(side="left", padx=2)
        
        ttk.Button(
            reports_frame, 
            text="📊 Generar Gráficos", 
            command=self.generar_graficos, 
            style="Accent.TButton"
        ).pack(side="left", padx=2)

        # Ajustar columnas para alineación
        main_container.columnconfigure(0, weight=1)
        main_container.columnconfigure(1, weight=1)
        main_container.columnconfigure(2, weight=1)

    def refresh_tables(self):
        """Refresca productos, movimientos y tasa."""
        self._load_tasa()
        self._refresh_productos()
        self._refresh_movimientos()
        self.btn_mod_prod.config(state="disabled")
        self.btn_del_prod.config(state="disabled")
        self.btn_del_mov.config(state="disabled")

    def _refresh_productos(self):
        """Carga productos; marca en rojo los bajo stock."""
        self.prod_table.delete(*self.prod_table.get_children())
        filtro = self.prod_search_var.get().lower()
        for p in sorted(obtener_productos(), key=lambda x: x[1]):
            if filtro and filtro not in p[1].lower():
                continue
            values = (p[0], p[1], p[2], f"{p[3]:,.2f}", p[4], p[5])
            tag = "bajo_stock" if p[4] <= p[5] else ""
            self.prod_table.insert("", "end", iid=p[0], values=values, tags=(tag,))

    def _refresh_movimientos(self):
        """Carga movimientos con columnas separadas de nombre y cantidad."""
        self.mov_table.delete(*self.mov_table.get_children())
        total = 0.0
        for m in obtener_movimientos():
            det = m[3] if isinstance(m[3], dict) else {}
            total += m[2]
            nombre = m[1]
            cantidad = det.get("cantidad", "")
            self.mov_table.insert("", "end", values=(
                m[0], nombre, cantidad, f"{m[2]:,.2f}", det.get("cliente", "")
            ))
        self.ganancias_label.config(text=f"Ganancias Totales: {total:,.2f} Bs.")

    def _on_prod_select(self, _):
        """Activa botones Modificar/Eliminar producto."""
        sel = bool(self.prod_table.selection())
        state = "normal" if sel else "disabled"
        self.btn_mod_prod.config(state=state)
        self.btn_del_prod.config(state=state)

    def _on_mov_select(self, _):
        """Activa botón Eliminar movimiento."""
        sel = bool(self.mov_table.selection())
        self.btn_del_mov.config(state="normal" if sel else "disabled")

    def confirm_delete_prod(self):
        """Elimina el producto seleccionado tras confirmación."""
        sel = self.prod_table.selection()
        if not sel: return
        cod, nombre = self.prod_table.item(sel[0], "values")[:2]
        if messagebox.askyesno("Confirmar", f"Eliminar {nombre}?"):
            eliminar_producto(cod)
            self.refresh_tables()

    def confirm_delete_mov(self):
        """Elimina movimiento y devuelve stock si corresponde."""
        sel = self.mov_table.selection()
        if not sel: return
        fecha = self.mov_table.item(sel[0], "values")[0]
        if not messagebox.askyesno("Confirmar", f"Eliminar movimiento {fecha}?"):
            return
        mov = next((m for m in obtener_movimientos() if m[0] == fecha), None)
        if mov and isinstance(mov[3], dict):
            pid = mov[3].get("producto_id")
            cnt = mov[3].get("cantidad", 0)
            if pid and cnt:
                prod = obtener_producto_por_codigo(pid)
                if prod is not None:
                    actualizar_producto(pid, prod[1], prod[2], prod[3], prod[4]+cnt, prod[5])
        eliminar_movimiento(fecha)
        self.refresh_tables()

    def open_prod_form(self):
        """Abre modal para crear un nuevo producto."""
        win = tk.Toplevel(self.root)
        win.title("Nuevo Producto"); win.geometry("400x350"); win.grab_set()
        campos = [("Nombre","str"),("Descripción","str"),
                  ("Precio","float"),("Stock","int"),("Mínimo","int")]
        vars_ = {}
        for i, (lbl, tipo) in enumerate(campos):
            ttk.Label(win, text=f"{lbl}:").grid(row=i, column=0, padx=10, pady=5, sticky="e")
            v = tk.StringVar()
            ttk.Entry(win, textvariable=v).grid(row=i, column=1, sticky="ew", padx=10)
            vars_[lbl] = (v, tipo)
        win.columnconfigure(1, weight=1)

        def guardar():
            try:
                data = {}
                for lbl, (v, t) in vars_.items():
                    val = v.get().strip()
                    if t == "str" and not val:
                        raise ValueError(f"{lbl} obligatorio")
                    if t == "float":
                        val = float(val.replace(",", "."))
                        if val <= 0:
                            raise ValueError("Precio inválido")
                    if t == "int":
                        val = int(val)
                    data[lbl] = val
                agregar_producto(
                    str(uuid.uuid4())[:8],
                    data["Nombre"], data["Descripción"],
                    data["Precio"], data["Stock"], data["Mínimo"]
                )
                win.destroy()
                self.refresh_tables()
            except Exception as e:
                messagebox.showerror("Error", str(e))

        btn_frame = ttk.Frame(win)
        btn_frame.grid(row=len(campos), column=0, columnspan=2, pady=15)
        ttk.Button(btn_frame, text="Guardar", style="Accent.TButton", command=guardar)\
            .pack(side="left", padx=5)
        ttk.Button(btn_frame, text="Cancelar", command=win.destroy)\
            .pack(side="left", padx=5)

    def open_mod_prod_form(self):
        """Abre modal para modificar el producto seleccionado."""
        sel = self.prod_table.selection()
        if not sel: return
        pid = self.prod_table.item(sel[0], "values")[0]
        p = obtener_producto_por_codigo(pid)
        if not p:
            return messagebox.showerror("Error", "Producto no encontrado")

        win = tk.Toplevel(self.root)
        win.title("Modificar Producto"); win.geometry("400x350"); win.grab_set()
        campos = [
            ("Nombre", p[1], "str"),
            ("Descripción", p[2], "str"),
            ("Precio", f"{p[3]:.2f}", "float"),
            ("Stock", str(p[4]), "int"),
            ("Mínimo", str(p[5]), "int")
        ]
        vars_ = {}
        for i, (lbl, init, t) in enumerate(campos):
            ttk.Label(win, text=f"{lbl}:").grid(row=i, column=0, padx=10, pady=5, sticky="e")
            v = tk.StringVar(value=init)
            ttk.Entry(win, textvariable=v).grid(row=i, column=1, sticky="ew", padx=10)
            vars_[lbl] = (v, t)
        win.columnconfigure(1, weight=1)

        def guardar_mod():
            try:
                data = {}
                for lbl, (v, t) in vars_.items():
                    val = v.get().strip()
                    if t == "str" and not val:
                        raise ValueError(f"{lbl} obligatorio")
                    if t == "float":
                        val = float(val.replace(",", "."))
                        if val <= 0:
                            raise ValueError("Precio inválido")
                    if t == "int":
                        val = int(val)
                    data[lbl] = val
                actualizar_producto(
                    pid,
                    data["Nombre"], data["Descripción"],
                    data["Precio"], data["Stock"], data["Mínimo"]
                )
                win.destroy()
                self.refresh_tables()
            except Exception as e:
                messagebox.showerror("Error", str(e))

        btn_frame = ttk.Frame(win)
        btn_frame.grid(row=len(campos), column=0, columnspan=2, pady=15)
        ttk.Button(btn_frame, text="Guardar", style="Accent.TButton", command=guardar_mod)\
            .pack(side="left", padx=5)
        ttk.Button(btn_frame, text="Cancelar", command=win.destroy)\
            .pack(side="left", padx=5)

    def open_single_sale(self):
        """Modal para venta individual de un producto."""
        sel = self.prod_table.selection()
        if not sel:
            return messagebox.showwarning("Atención", "Seleccione un producto")
        pid, nombre, _, precio_str, stock_str, _ = self.prod_table.item(sel[0], "values")
        precio = float(precio_str.replace(",", ""))
        stock = int(stock_str)
        
        win = tk.Toplevel(self.root)
        win.title("Venta Individual"); win.geometry("350x350"); win.grab_set()
        ttk.Label(win, text=nombre, style="header.TLabel").pack(pady=10)
        ttk.Label(win, text=f"Precio: {precio:,.2f} Bs.").pack()
        cantidad = tk.IntVar(value=1)
        ttk.Spinbox(win, from_=1, to=stock, textvariable=cantidad).pack(pady=5)
        cliente = tk.StringVar()
        ttk.Label(win, text="Cliente (opcional):").pack()
        ttk.Entry(win, textvariable=cliente).pack(fill="x", padx=20, pady=5)

        def procesar():
            c = cantidad.get()
            if c < 1 or c > stock:
                return messagebox.showerror("Error", "Cantidad inválida")
            total = precio * c
            detalles = {"producto_id": pid, "cantidad": c, "cliente": cliente.get().strip() or None}
            registrar_movimiento(f"{c}x {nombre}", total, detalles)
            prod = obtener_producto_por_codigo(pid)
            if prod is None:
                messagebox.showerror("Error", "Producto no encontrado")
                return
            actualizar_producto(pid, prod[1], prod[2], prod[3], prod[4] - c, prod[5])
            win.destroy()
            self.refresh_tables()

        btn_frame = ttk.Frame(win)
        btn_frame.pack(pady=15)
        ttk.Button(btn_frame, text="Vender", style="Accent.TButton", command=procesar)\
            .pack(side="left", padx=5)
        ttk.Button(btn_frame, text="Cancelar", command=win.destroy)\
            .pack(side="left", padx=5)

    def open_batch_sale(self):
        """Modal para venta por lote con filtrado, selección y total dinámico."""
        win = tk.Toplevel(self.root)
        win.title("Venta por Lote"); win.geometry("900x650"); win.grab_set()
        win.columnconfigure(0, weight=1); win.rowconfigure(3, weight=1)

        # Tasa de dólar
        tasa = obtener_tasa_dolar()
        ttk.Label(win, text=f"Tasa USD: {tasa:.2f} Bs.", style="bold.TLabel")\
            .grid(row=0, column=0, sticky="ne", padx=10, pady=5)

        # Búsqueda
        sv = tk.StringVar()
        sf = ttk.Frame(win); sf.grid(row=1, column=0, sticky="ew", padx=10, pady=5)
        ttk.Label(sf, text="Buscar producto:", style="bold.TLabel").pack(side="left")
        ttk.Entry(sf, textvariable=sv).pack(side="left", fill="x", expand=True, padx=5)
        ttk.Button(sf, text="×", style="Warning.TButton", command=lambda: sv.set("")).pack(side="left")

        # Treeview
        cols = ("Código","Nombre","Descripción","Precio Bs.","Stock","Mínimo","Cantidad a Vender")
        tree = ttk.Treeview(win, columns=cols, show="headings", selectmode="extended")
        for c,w in zip(cols,(80,100,10,100,80,80,100)):
            tree.heading(c, text=c); tree.column(c, width=w, anchor="center")
        tree.grid(row=3, column=0, sticky="nsew", padx=10)
        vsb = ttk.Scrollbar(win, orient="vertical", command=tree.yview)
        tree.configure(yscrollcommand=vsb.set); vsb.grid(row=3, column=1, sticky="ns")

        spins = {}
        def load_prods():
            tree.delete(*tree.get_children())
            for p in obtener_productos():
                if sv.get().lower() not in p[1].lower():
                    continue
                iid = p[0]
                tree.insert("", "end", iid=iid, values=(
                    p[0], p[1], p[2], f"{p[3]:,.2f}", p[4], p[5], 0
                ))
        load_prods(); sv.trace_add("write", lambda *a: load_prods())

        def on_double(e):
            region = tree.identify("region", e.x, e.y)
            col    = tree.identify_column(e.x)
            if region=="cell" and col=="#7":
                iid = tree.identify_row(e.y)
                x, y, w, h = tree.bbox(iid, col)
                x = int(x)
                y = int(y)
                if iid in spins: spins[iid].destroy()
                mx = int(tree.set(iid,"Stock"))
                sb = ttk.Spinbox(win, from_=0, to=mx, width=5, justify="center")
                sb.place(
                    x=x+tree.winfo_rootx()-win.winfo_rootx(),
                    y=y+tree.winfo_rooty()-win.winfo_rooty()
                )
                sb.set(tree.set(iid,"Cantidad a Vender"))
                spins[iid]=sb
                def finish(evt=None):
                    tree.set(iid,"Cantidad a Vender", sb.get())
                    sb.destroy(); del spins[iid]; calc_total()
                sb.bind("<FocusOut>", finish); sb.bind("<Return>", finish); sb.focus()
        tree.bind("<Double-1>", on_double)

        # Total dinámico
        total_var = tk.StringVar(master=win, value="0.00")
        def calc_total():
            tot=0.0
            for iid in tree.get_children():
                pr=float(tree.set(iid,"Precio Bs.").replace(",",""))
                c = int(tree.set(iid,"Cantidad a Vender"))
                tot += pr*c
            total_var.set(f"{tot:,.2f}")

        ttk.Button(win, text="Recalcular Total", command=calc_total)\
            .grid(row=2, column=0, sticky="e", padx=10)
        ttk.Label(win, text="Total Bs.:", style="bold.TLabel")\
            .grid(row=2, column=0, sticky="w", padx=10)
        ttk.Label(win, textvariable=total_var, style="header.TLabel")\
            .grid(row=2, column=0, sticky="w", padx=100)

        # Botones de acción
        btn_frame = ttk.Frame(win); btn_frame.grid(row=4, column=0, pady=15)
        def procesar_lote():
            ventas=[]
            for iid in tree.get_children():
                c=int(tree.set(iid,"Cantidad a Vender"))
                if c<=0: continue
                p=obtener_producto_por_codigo(iid)
                if p is None:
                    messagebox.showerror("Error", f"Producto con código {iid} no encontrado")
                    return
                if c>p[4]:
                    return messagebox.showerror("Error",f"Stock insuficiente de {p[1]}")
                ventas.append((iid,p[1],p[3]*c,c))
            if not ventas:
                return messagebox.showwarning("Atención","No hay productos seleccionados")
            if not messagebox.askyesno("Confirmar",f"Registrar venta lote por {total_var.get()} Bs.?"):
                return
            for cod,nom,total,c in ventas:
                registrar_movimiento(f"{c}x {nom}",total,{"producto_id":cod,"cantidad":c})
                p = obtener_producto_por_codigo(cod)
                if p is not None:
                    actualizar_producto(cod, p[1], p[2], p[3], p[4]-c, p[5])
                else:
                    messagebox.showerror("Error", f"Producto con código {cod} no encontrado")
            win.destroy(); self.refresh_tables()

        ttk.Button(btn_frame, text="Vender Lote", style="Accent.TButton", command=procesar_lote)\
            .pack(side="left", padx=5)
        ttk.Button(btn_frame, text="Cancelar", command=win.destroy)\
            .pack(side="left", padx=5)

    def verificar_o_modificar_tasa(self):
        """Modal para ver/actualizar tasa de cambio."""
        try:
            t = obtener_tasa_dolar()
            if messagebox.askyesno("Tasa", f"Tasa actual: {t:.2f}\n¿Modificar?"):
                nt = simpledialog.askfloat("Nueva tasa","Valor:", initialvalue=t)
                if nt and nt > 0:
                    actualizar_tasa_dolar(nt)
                    messagebox.showinfo("Listo", f"Tasa actualizada a {nt:.2f}")
        except Exception as e:
            messagebox.showerror("Error", str(e))


if __name__ == "__main__":
    root = tk.Tk()
    app = BodegaApp(root)
    root.mainloop()