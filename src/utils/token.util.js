/**
 * Genera un token único basado en timestamp, random y IP
 * @param {string} ip - Dirección IP del cliente
 * @returns {string} Token único
 */
export const generarTokenUnico = (ip) => {
  // Limpiar IP (quitar puntos)
  const ipLimpia = ip ? ip.replace(/\./g, "") : "anon";

  // Generar partes del token
  const timestamp = Date.now().toString(36); // Tiempo actual en base36
  const random1 = Math.random().toString(36).substring(2, 10); // Parte aleatoria 1
  const random2 = Math.random().toString(36).substring(2, 10); // Parte aleatoria 2

  // Combinar todo
  return `${timestamp}-${random1}-${random2}-${ipLimpia}`;
};

/**
 * Valida el formato básico de un token
 * @param {string} token - Token a validar
 * @returns {boolean} True si el formato es válido
 */
export const validarFormatoToken = (token) => {
  if (!token || typeof token !== "string") return false;

  // Un token válido tiene 4 partes separadas por guiones
  const partes = token.split("-");
  return partes.length === 4;
};
