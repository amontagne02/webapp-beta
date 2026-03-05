// Validación de token para rutas protegidas

import {
  haySesionActiva,
  sesionExpirada,
  renovarExpiracion,
  getSesion,
  esMismaIP,
} from "../utils/session.util.js";
import { validarFormatoToken } from "../utils/token.util.js";

// Rutas que NO requieren autenticación
const RUTAS_PUBLICAS = ["/", "/api/test", "/api/estado-publico"];

/**
 * Middleware para validar token de sesión
 */
export const validarToken = (req, res, next) => {
  // 1. Verificar si es ruta pública
  if (RUTAS_PUBLICAS.includes(req.path)) {
    return next();
  }

  // 2. Obtener token del header
  const token = req.headers["x-session-token"];

  // 3. Verificar si hay sesión activa
  if (!haySesionActiva()) {
    console.log("⛔ Petición sin sesión activa:", req.path);
    return res.status(401).json({
      error: "NO_HAY_SESION",
      mensaje: "No hay una sesión activa. Visita la página principal.",
    });
  }

  // 4. Verificar expiración
  if (sesionExpirada()) {
    console.log("⛔ Sesión expirada");
    return res.status(401).json({
      error: "SESION_EXPIRADA",
      mensaje: "La sesión ha expirado. Vuelve a la página principal.",
    });
  }

  // 5. Validar formato del token
  if (!validarFormatoToken(token)) {
    console.log("⛔ Formato de token inválido");
    return res.status(403).json({
      error: "TOKEN_INVALIDO",
      mensaje: "Formato de token inválido.",
    });
  }

  // 6. Validar que el token coincide
  const { tokenActivo, ipActiva } = getSesion();

  if (token !== tokenActivo) {
    console.log(
      "⛔ Token no coincide. Esperado:",
      tokenActivo,
      "Recibido:",
      token,
    );
    return res.status(403).json({
      error: "TOKEN_INCORRECTO",
      mensaje: "Token de sesión incorrecto.",
    });
  }

  // 7. Validar que la IP coincide (seguridad extra)
  const ipCliente = req.ip;
  if (!esMismaIP(ipCliente)) {
    console.log("⛔ IP diferente:", ipCliente, "vs", ipActiva);
    return res.status(403).json({
      error: "IP_DIFERENTE",
      mensaje: "La IP no coincide con la sesión activa.",
    });
  }

  // 8. Todo OK - renovar expiración
  renovarExpiracion();

  // 9. Continuar
  next();
};
