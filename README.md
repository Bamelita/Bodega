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
cd server
cp .env.example .env
# Edita .env con tus configuraciones
```

4. **Inicializar la base de datos**

```bash
cd server
node seed.js
```

5. **Iniciar la aplicación**

```bash
# Desde el directorio raíz
npm start
```

Accede a la aplicación en: `http://localhost:5173`

**Credenciales por defecto:**

- Usuario: `admin`
- Contraseña: `admin123`

## ✨ Características

### Principales

- 🔐 Autenticación mediante JWT
- 👥 Acceso basado en roles (Administrador/Usuario)
- 📦 Gestión de productos (CRUD completo)
- 📊 Control de inventario con precios en USD/VES
- 📈 Registro de movimientos de ventas y compras
- 💰 Seguimiento de pagos

### Funciones de Administrador

- 👤 Gestión de usuarios
- 💾 Respaldos manuales y automáticos
- 🗑️ Retención automática de respaldos
- 📋 Registro de auditoría (todas las acciones rastreadas)
- 📄 Importación y exportación a Excel

### Interfaz (UX/UI)

- 🎨 Interfaz moderna (Rediseñada recientemente con diseño Glassmorphism)
- 🔔 Notificaciones dinámicas (Toast)
- ✅ Ventanas modales de confirmación
- 📱 Diseño totalmente responsivo

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

## 🛡️ Seguridad

- Contraseñas encriptadas con bcrypt
- Autenticación con token JWT
- Autorización basada en roles
- Registro completo de auditoría
- Rastreo de direcciones IP

## 🛠️ Solución de Problemas

### El puerto ya está en uso

```bash
# Matar el proceso en el puerto 3001 (Windows)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Matar el proceso en el puerto 5173
netstat -ano | findstr :5173
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
