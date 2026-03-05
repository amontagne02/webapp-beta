import express from "express";
import path from "path";
import os from "os";
import fs from "fs";
import { fileURLToPath } from "url";
import posRoutes from "./routes/pos.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import authRoutes from "./routes/auth.routes.js";
import * as control from "./utils/server-control.js";
import { validarToken } from "./middlewares/auth.middleware.js";
import { generarTokenUnico } from "./utils/token.util.js";

// Importar utilidades de sesión
import {
  iniciarSesion,
  haySesionActiva,
  getSesion,
  esMismaIP,
} from "./utils/session.util.js";

// Obtener __dirname equivalente en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PUERTO = 3000;

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: false }));

// Rutas
app.use("/api", authRoutes);
app.use("/api", validarToken, posRoutes);
app.use("/api", validarToken, ventasRoutes);

// Ruta de prueba
app.get("/api/test", validarToken, (req, res) => {
  res.json({
    mensaje: "✅ Servidor funcionando correctamente (ES Modules)",
    hora: new Date().toLocaleString(),
  });
});

// Ruta para ver estado del servidor
app.get("/api/estado", validarToken, (req, res) => {
  const info = control.obtenerInfoFlags();
  res.json({
    servidorActivo: info.existeActivo,
    timestampInicio: info.timestampActivo,
    flags: info,
  });
});

// Ruta raíz con lógica de sesión
app.get("/", (req, res) => {
  const ipCliente = req.ip;

  console.log("🌐 Visita a la raíz desde IP:", ipCliente);

  // Si ya hay sesión activa y no es el mismo cliente
  if (haySesionActiva() && !esMismaIP(ipCliente)) {
    console.log("🔒 Rechazado - ya hay un cliente activo");

    // Enviar página de ocupado
    const ocupadoPath = path.join(__dirname, "views", "ocupado.html");
    return res.sendFile(ocupadoPath);
  }

  // Primera vez o mismo cliente
  if (!haySesionActiva()) {
    const nuevoToken = generarTokenUnico(ipCliente);
    iniciarSesion(ipCliente, nuevoToken);

    console.log("🎫 NUEVA SESIÓN INICIADA:");
    console.log(`   └─ IP: ${ipCliente}`);
    console.log(`   └─ Token: ${nuevoToken}`);
  }

  // Leer y modificar el HTML para inyectar el token
  const indexPath = path.join(__dirname, "public", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  const { tokenActivo } = getSesion();
  html = html.replace(
    "</head>",
    `<script>window.SESSION_TOKEN = "${tokenActivo}";</script>\n</head>`,
  );

  res.send(html);
});

// Función para obtener IP local
function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();
  for (const nombre in interfaces) {
    for (const iface of interfaces[nombre]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Iniciar servidor
app.listen(PUERTO, "0.0.0.0", () => {
  const ipLocal = obtenerIPLocal();
  // Crear flag de servidor activo usando nuestro módulo
  control.crearFlagActivo();

  console.log("\n=================================");
  console.log("🚀 Servidor iniciado (ES Modules)");
  console.log("=================================");
  console.log(`📍 En tu PC:`);
  console.log(`   http://localhost:${PUERTO}`);
  console.log("\n📱 En tu MÓVIL:");
  console.log(`   http://${ipLocal}:${PUERTO}`);
  console.log("=================================\n");
  console.log("📂 Directorio:", __dirname);
});

// Intervalo que revisa cada 2 segundos si debe detenerse
const intervaloRevision = setInterval(() => {
  if (control.debeDetenerse()) {
    console.log("🛑 Señal de detención recibida. Apagando servidor...");

    // Limpiar flag de detener
    control.limpiarFlagDetener();

    // Eliminar flag activo
    control.eliminarFlagActivo();

    // Detener el intervalo
    clearInterval(intervaloRevision);

    // Cerrar servidor
    server.close(() => {
      console.log("✅ Servidor apagado correctamente");
      process.exit(0);
    });
  }
}, 2000);

// Manejar señales del sistema (Ctrl+C)
process.on("SIGINT", () => {
  console.log("\n🛑 Recibida señal SIGINT (Ctrl+C)");
  control.limpiarTodosLosFlags();
  clearInterval(intervaloRevision);
  server.close(() => {
    console.log("✅ Servidor apagado por usuario");
    process.exit(0);
  });
});

// Manejar cierre inesperado
process.on("SIGTERM", () => {
  console.log("🛑 Recibida señal SIGTERM");
  control.limpiarTodosLosFlags();
  clearInterval(intervaloRevision);
  server.close(() => {
    console.log("✅ Servidor apagado");
    process.exit(0);
  });
});
