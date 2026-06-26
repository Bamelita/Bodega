# Bodega - Sistema de Gestión de Inventario

Aplicación web moderna para la gestión de inventario con control de acceso basado en roles, registro de auditoría, interfaz estética (glassmorphism) y respaldos automáticos.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 16+
- npm o yarn

### Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/Bamelita/Bodega.git
cd Bodega
```

2. **Instalar dependencias**

```bash
# Raíz (para correr cliente y servidor simultáneamente)
npm install

# Servidor
cd server
npm install

# Cliente
cd ../client
npm install
```

3. **Configurar el entorno**

```bash
# Servidor
cd server
cp .env.example .env
# Edita .env con tus configuraciones backend (PORT, JWT_SECRET, etc.)

# Cliente
cd ../client
cp .env.example .env
# Edita .env con la URL de la API (VITE_API_URL)
```

4. **Inicializar la base de datos**

```bash
cd server
node seed.js
```

5. **Iniciar la aplicación**

Para iniciar tanto el backend como el frontend simultáneamente (con `concurrently` y `nodemon` para desarrollo):

```bash
# Desde el directorio raíz
npm run dev
```

Accede a la aplicación en: `http://localhost:3000`

**Credenciales por defecto:**

- Usuario: `admin`
- Contraseña: `admin123`

## ✨ Características

### Principales

- 🎨 **Diseño Glassmorphism**: Interfaz moderna, dinámica y completamente rediseñada bajo el estilo "vidrio esmerilado" 100% responsiva (Modo Claro/Oscuro).
- 🔐 **Seguridad y Control**: Autenticación mediante JWT con separación arquitectónica estricta (RBAC) entre rutas de Administrador y Usuario.
- 📊 **Panel Estadístico**: Gráficos interactivos y KPIs visuales en tiempo real.
- 📄 **Exportación/Importación**: Capacidad nativa para exportar a PDF y Excel (CSV) e importación masiva de datos.

### 👤 Módulo de Usuario (Operativo)

- **Inventario**: Control total (CRUD) de productos, stock y gestión multi-moneda.
- **Ventas**: Registro interactivo de una o múltiples ventas con generación de recibos.
- **Clientes**: Directorio para el control y seguimiento de la base de datos de clientes.
- **Reportes**: Análisis visual de la rentabilidad, ventas recientes e ingresos generados.
- **Respaldos Propios**: Opciones para generar y descargar copias de seguridad de sus datos personales.

### 🛡️ Módulo de Administrador (Supervisión)

- **Control de Usuarios**: Creación, modificación (cambio de nombres/contraseñas), suspensión y eliminación de usuarios del sistema.
- **Planes y Facturación**: Gestión de métodos de pago, montos, registro de pagos y control de fechas de corte para cada suscriptor.
- **Respaldos Globales**: Generación y retención de respaldos completos (manual y automático).
- **Auditoría del Sistema**: Historial detallado de cada acción, evento de seguridad e IP registrada.
- **Configuración y Seguridad**: Gestión avanzada de sesiones, límites de base de datos, y notificaciones.

## 📁 Estructura del Proyecto

```
Bodega/
├── client/          # Frontend en React (Vite) con TailwindCSS y diseño Glassmorphism
├── server/          # Backend en Node.js (Express)
│   ├── models/      # Modelos de Sequelize
│   ├── routes/      # Rutas de la API
│   ├── middleware/  # Middleware de autenticación
│   ├── utils/       # Utilidades (respaldos, auditoría, etc.)
│   └── backups/     # Respaldos de SQLite
```

## 🔧 Configuración

Edita `server/.env`:

```bash
PORT=3001
JWT_SECRET=tu_clave_secreta

# Respaldos automáticos
AUTO_BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *  # Diariamente a las 2 AM
```

## 📖 Documentación

Consulta `walkthrough.md` para ver la guía detallada de las funcionalidades.

## 🛡️ Seguridad y Optimización

- Contraseñas encriptadas con `bcrypt`.
- Autenticación con token JWT.
- Autorización estricta basada en roles (`requireAdmin` middleware).
- Protección de encabezados HTTP con `helmet`.
- Logging de peticiones con `morgan`.
- Compresión de respuestas HTTP con `compression` para optimizar ancho de banda.
- Limitación de solicitudes con `express-rate-limit` para mitigar ataques DDoS/Fuerza bruta.
- Registro completo de auditoría y rastreo de direcciones IP.

## 🛠️ Solución de Problemas

### El puerto ya está en uso

```bash
# Matar el proceso en el puerto 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Matar el proceso en el puerto 3000 (Vite)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Base de datos bloqueada (Database locked)

```bash
# Detener el servidor y borrar los archivos de bloqueo
cd server
del bodega.sqlite-shm
del bodega.sqlite-wal
node seed.js  # Reinicializar
```

### Error de JWT_SECRET faltante

```bash
# Asegúrate de tener un archivo .env
cd server
copy .env.example .env
# Edita el archivo .env y configura JWT_SECRET
```

### El cliente no inicia

```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Errores al importar Excel

- Asegúrate de que el archivo tenga las columnas: SKU, Name, Description, Price (USD), Stock, Active
- SKU y Name son obligatorios
- Active debe ser "Yes" o "No"

## 📝 Licencia

MIT
