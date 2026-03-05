// Estado de la sesión (en memoria)
let tokenActivo = null;
let ipActiva = null;
let fechaExpiracion = null;
const TIEMPO_EXPIRACION = 30 * 60 * 1000; // 30 minutos

// Obtener estado actual
export const getSesion = () => ({
  tokenActivo,
  ipActiva,
  fechaExpiracion,
  TIEMPO_EXPIRACION
});

// Iniciar sesión
export const iniciarSesion = (ip, token) => {
  tokenActivo = token;
  ipActiva = ip;
  fechaExpiracion = Date.now() + TIEMPO_EXPIRACION;
};

// Cerrar sesión
export const cerrarSesion = () => {
  tokenActivo = null;
  ipActiva = null;
  fechaExpiracion = null;
};

// Verificar si hay sesión activa
export const haySesionActiva = () => tokenActivo !== null;

// Renovar expiración
export const renovarExpiracion = () => {
  if (fechaExpiracion) {
    fechaExpiracion = Date.now() + TIEMPO_EXPIRACION;
  }
};

// Verificar si la sesión ha expirado
export const sesionExpirada = () => {
  return fechaExpiracion && Date.now() > fechaExpiracion;
};

// Verificar si una IP es la misma de la sesión
export const esMismaIP = (ip) => ip === ipActiva;