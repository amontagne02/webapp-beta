import express from "express";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import posRoutes from "./routes/pos.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import * as control from "./utils/server-control.js";

// Obtener __dirname equivalente en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PUERTO = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use(posRoutes);
app.use(ventasRoutes);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Ruta de prueba
app.get("/api/test", (req, res) => {
  res.json({
    mensaje: "✅ Servidor funcionando correctamente (ES Modules)",
    hora: new Date().toLocaleString(),
  });
});

// Ruta para ver estado del servidor
app.get("/api/estado", (req, res) => {
  const info = control.obtenerInfoFlags();
  res.json({
    servidorActivo: info.existeActivo,
    timestampInicio: info.timestampActivo,
    flags: info,
  });
});

// Ruta raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
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
