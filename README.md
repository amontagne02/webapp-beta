# webapp-beta — POS Móvil

Sistema de Punto de Venta (POS) diseñado para usarse desde un dispositivo móvil en red local. La aplicación web se comunica con un archivo Excel que actúa como intermediario de datos entre el frontend y un sistema de gestión en Excel con macros VBA.

> **Flujo:** Móvil → API Express → Excel (`datos.xlsx`) → Macros de Excel procesan las ventas.

---

## Características

- 📱 **Frontend mobile-first** con tema oscuro, búsqueda en tiempo real y carrito flotante
- 🔒 **Sesión única** vinculada a IP con token y expiración renovable (30 min)
- 📊 **Persistencia en Excel** — sin base de datos tradicional
- 🚦 **Control por flags** — macros de Excel pueden iniciar/detener el servidor
- 📦 **Installer portable** con Inno Setup (auto-instala Node.js si es necesario)
- ⚡ **ES Modules** con Express 5

---

## Requisitos

- **Node.js** v18+ (auto-instalado por el installer si no está presente)
- **Windows** (se usa `xlsx-populate` y macros VBA de Excel)
- **Red local** para acceso desde dispositivo móvil
- **`data/datos.xlsx`** con las hojas `Productos` y `Pendientes`

---

## Instalación

### Desarrollo local

```bash
cd webapp-beta
git clone <repo-url>
npm install
```

### Producción (con installer)

1. Compilar el installer con [Inno Setup 6](https://jrsoftware.org/isdl.php):

```bat
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" "installer\webapp-beta-portable.iss"
```

2. Distribuir `installer/output/webapp-beta-portable-installer.exe`
3. En la PC destino: ejecutar el installer (detecta e instala Node.js automáticamente)
4. El installer crea `start-server.bat` para iniciar el servidor

---

## Uso

### Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

### Acceder desde el móvil

```
http://{IP-del-servidor}:3000
```

### Control desde Excel (macros VBA)

| Acción | Mecanismo |
|--------|-----------|
| Iniciar servidor | Macro ejecuta `start-server.bat` |
| Verificar estado | Macro lee `flags/servidor_activo.flag` |
| Detener servidor | Macro crea `flags/detener.flag` |

---

## Configuración

El proyecto usa variables de entorno. Para desarrollo funciona con los valores por defecto.

```bash
# Copiar template
copy .env.example .env
```

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3000` | Puerto del servidor |
| `SESSION_EXPIRATION_MS` | `1800000` (30 min) | Tiempo de expiración de sesión |

---

## Estructura del Proyecto

```
webapp-beta/
├── src/
│   ├── server.js                 # Entry point (Express)
│   ├── routes/
│   │   ├── auth.routes.js        # Autenticación (sesión/token)
│   │   ├── pos.routes.js         # Productos
│   │   └── ventas.routes.js      # Ventas
│   ├── controllers/
│   │   ├── pos.controller.js     # Lee productos desde Excel
│   │   └── ventas.controller.js  # Escribe ventas en Excel
│   ├── middlewares/
│   │   └── auth.middleware.js    # Validación de token de sesión
│   ├── utils/
│   │   ├── excelHelper.js        # CRUD con Excel (xlsx-populate)
│   │   ├── server-control.js     # Gestión de flags (activo/detener)
│   │   ├── session.util.js       # Sesión en memoria (IP + token + expiración)
│   │   ├── token.util.js         # Generación y validación de tokens
│   │   └── date.util.js          # Helpers de fecha (hora local)
│   ├── public/
│   │   ├── index.html            # UI principal del POS
│   │   ├── css/style.css         # Estilos (tema oscuro, responsive)
│   │   └── js/app.js             # Lógica del frontend
│   └── views/
│       └── ocupado.html          # Página "POS Ocupado"
├── data/
│   └── datos.xlsx                # Base de datos intermediaria
├── flags/                        # Control del servidor
│   ├── servidor_activo.flag
│   └── detener.flag
├── installer/
│   ├── webapp-beta-portable.iss  # Script de Inno Setup
│   └── README-INSTALLER.md       # Documentación del installer
├── .env                          # Variables locales (no subir a git)
├── .env.example                  # Template de variables
├── .gitignore
└── package.json
```

---

## API Endpoints

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `GET /` | GET | No | Página principal (inyecta `SESSION_TOKEN`) |
| `GET /api/test` | GET | Sí | Prueba de servidor |
| `GET /api/estado` | GET | Sí | Estado de flags del servidor |
| `GET /api/estado-sesion` | GET | Sí | Detalle de sesión activa |
| `GET /api/estado-publico` | GET | No | Indica si hay sesión activa (público) |
| `POST /api/cerrar-sesion` | POST | Sí | Cierra la sesión activa |
| `GET /api/productos` | GET | Sí | Lista productos desde Excel |
| `POST /api/ventas` | POST | Sí | Registra una venta en Excel |

Todas las peticiones autenticadas envían el token en el header `x-session-token`.

---

## Flujo de una Venta

```
1. Usuario abre navegador → http://{IP}:3000
2. Servidor genera token de sesión (primera visita)
3. Frontend carga productos desde Excel
4. Usuario busca producto (filtro en tiempo real)
5. Usuario toca "+" → se agrega al carrito
6. Usuario abre carrito, ajusta cantidades, ingresa pago
7. Usuario toca "Pagar" → POST /api/ventas
8. Servidor valida pago, verifica stock, escribe en Excel
9. Frontend limpia carrito y recarga productos
10. Macros de Excel leen "Pendientes", procesan ventas, marcan Procesado=true
```

---

## Estructura de `datos.xlsx`

### Hoja "Productos"

| Columna | Campo | Descripción |
|---------|-------|-------------|
| A | `codigo` | Identificador del producto |
| B | `producto` | Nombre del producto |
| C | `disponibilidad` | Stock disponible |

### Hoja "Pendientes"

| Columna | Campo | Descripción |
|---------|-------|-------------|
| A | `FacturaID` | Formato: `[fecha serial 5 dígitos][consecutivo 5 dígitos]` |
| B | `FechaHora` | ISO local: `2026-04-06T14:11:43.886` |
| C | `CodigoProducto` | Código del producto |
| D | `Nombre` | Nombre del producto |
| E | `CantVendida` | Cantidad vendida |
| F | `PrecioUnitario` | Precio unitario |
| G | `Subtotal` | Cantidad × Precio |
| H | `Efectivo` | Monto pagado en efectivo |
| I | `Transferencia` | Monto pagado por transferencia |
| J | `Procesado` | `false` por defecto (macros lo ponen en `true`) |

---

## Autenticación

- **Modelo:** Single-session, vinculada a IP, con token y expiración.
- **Inicio:** Primer visitante a `/` recibe un token único inyectado en el HTML.
- **Uso:** Cada petición API envía `x-session-token` en el header.
- **Expiración:** 30 minutos de inactividad (se renueva con cada petición válida).
- **IP binding:** Si otro dispositivo intenta acceder, ve la página "POS Ocupado".
- **Cierre:** `POST /api/cerrar-sesion` o apagar el servidor.

---

## Distribución

### Opción A: GitHub (desarrolladores)

```bash
git clone <repo-url>
cd webapp-beta
npm install
npm start
```

### Opción B: Installer portable (usuarios finales)

El installer con Inno Setup:
- Copia el proyecto manteniendo la estructura.
- Detecta e instala Node.js v22 automáticamente si no está presente.
- Ejecuta `npm install --omit=dev`.
- Crea `start-server.bat` y acceso directo opcional.

---

## Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | v18+ | Runtime |
| Express | 5.2.1 | Servidor HTTP / API |
| xlsx-populate | 1.21.0 | Lectura/escritura de Excel |
| dotenv | latest | Variables de entorno |
| nodemon | 3.1.14 | Hot reload (dev) |

---

## Licencia

MIT
