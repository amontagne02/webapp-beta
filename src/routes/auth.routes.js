// ============================================
// ROUTES: auth.routes.js
// Endpoints relacionados con autenticación
// ============================================

import { Router } from "express";
import {
  cerrarSesion,
  getSesion,
  haySesionActiva,
} from "../utils/session.util.js";
import { validarToken } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/estado-sesion
 * Ver el estado de la sesión actual
 */
router.get("/estado-sesion", validarToken, (req, res) => {
  const { tokenActivo, ipActiva, fechaExpiracion } = getSesion();

  res.json({
    activa: true,
    ip: ipActiva,
    expira: new Date(fechaExpiracion).toLocaleString(),
    token: tokenActivo ? tokenActivo.substring(0, 10) + "..." : null,
  });
});

/**
 * GET /api/estado-publico
 * Estado público (no requiere token)
 */
router.get("/estado-publico", (req, res) => {
  res.json({
    haySesion: haySesionActiva(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/cerrar-sesion
 * Cerrar la sesión actual
 */
router.post("/cerrar-sesion", validarToken, (req, res) => {
  console.log("👋 Cerrando sesión para IP:", req.ip);

  cerrarSesion();

  res.json({
    ok: true,
    mensaje: "Sesión cerrada correctamente",
  });
});

export default router;
