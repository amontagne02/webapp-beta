// ============================================
// UTILS: Date Helper
// ============================================
// Helper para manejar fechas de forma consistente en toda la app
// Política: usar hora local del ordenador sin conversiones UTC
// ============================================

/**
 * Genera un timestamp en formato ISO con hora local del ordenador
 * Ejemplo: "2026-04-06T14:11:43.886" (sin Z ni offset, hora local exacta)
 */
export const fechaLocalISO = (fecha = new Date()) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const hours = String(fecha.getHours()).padStart(2, '0');
  const minutes = String(fecha.getMinutes()).padStart(2, '0');
  const seconds = String(fecha.getSeconds()).padStart(2, '0');
  const ms = String(fecha.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
};

/**
 * Obtiene la fecha actual como objeto Date para usar consistentemente
 * en generarFacturaIdExcel y fechaLocalISO
 */
export const obtenerFechaActual = () => {
  return new Date();
};
