// ============================================
// MÓDULO: server-control.js
// Control del servidor mediante archivos flag
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ_PROYECTO = path.resolve(__dirname, '..', '..');

// Rutas de los archivos flag
const FLAGS_DIR = path.join(RAIZ_PROYECTO, 'flags');
const FLAG_ACTIVO = path.join(FLAGS_DIR, 'servidor_activo.flag');
const FLAG_DETENER = path.join(FLAGS_DIR, 'detener.flag');

// ============================================
// 1. CREAR FLAG DE SERVIDOR ACTIVO
// ============================================
export function crearFlagActivo() {
  try {
    // Asegurar que la carpeta flags existe
    if (!fs.existsSync(FLAGS_DIR)) {
      fs.mkdirSync(FLAGS_DIR, { recursive: true });
      console.log('📁 Carpeta flags creada');
    }
    
    // Escribir el flag con la fecha de inicio
    fs.writeFileSync(FLAG_ACTIVO, new Date().toISOString());
    console.log('✅ Flag de servidor activo creado');
    return true;
  } catch (error) {
    console.error('❌ Error creando flag activo:', error.message);
    return false;
  }
}

// ============================================
// 2. ELIMINAR FLAG DE SERVIDOR ACTIVO
// ============================================
export function eliminarFlagActivo() {
  try {
    if (fs.existsSync(FLAG_ACTIVO)) {
      fs.unlinkSync(FLAG_ACTIVO);
      console.log('✅ Flag de servidor activo eliminado');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error eliminando flag activo:', error.message);
    return false;
  }
}

// ============================================
// 3. VERIFICAR SI EL SERVIDOR ESTÁ ACTIVO
// ============================================
export function servidorEstaActivo() {
  try {
    return fs.existsSync(FLAG_ACTIVO);
  } catch (error) {
    return false;
  }
}

// ============================================
// 4. VERIFICAR SI DEBEMOS DETENERNOS
// ============================================
export function debeDetenerse() {
  try {
    return fs.existsSync(FLAG_DETENER);
  } catch (error) {
    return false;
  }
}

// ============================================
// 5. LIMPIAR FLAG DE DETENCIÓN
// ============================================
export function limpiarFlagDetener() {
  try {
    if (fs.existsSync(FLAG_DETENER)) {
      fs.unlinkSync(FLAG_DETENER);
      console.log('✅ Flag de detener limpiado');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error limpiando flag detener:', error.message);
    return false;
  }
}

// ============================================
// 6. CREAR FLAG DE DETENCIÓN (para pruebas)
// ============================================
export function solicitarDetencion() {
  try {
    fs.writeFileSync(FLAG_DETENER, new Date().toISOString());
    console.log('🛑 Señal de detención enviada');
    return true;
  } catch (error) {
    console.error('❌ Error solicitando detención:', error.message);
    return false;
  }
}

// ============================================
// 7. OBTENER INFORMACIÓN DE LOS FLAGS
// ============================================
export function obtenerInfoFlags() {
  const info = {
    flagsDir: FLAGS_DIR,
    flagActivo: FLAG_ACTIVO,
    flagDetener: FLAG_DETENER,
    existeActivo: fs.existsSync(FLAG_ACTIVO),
    existeDetener: fs.existsSync(FLAG_DETENER),
    timestampActivo: null,
    timestampDetener: null
  };
  
  try {
    if (info.existeActivo) {
      info.timestampActivo = fs.readFileSync(FLAG_ACTIVO, 'utf8');
    }
    if (info.existeDetener) {
      info.timestampDetener = fs.readFileSync(FLAG_DETENER, 'utf8');
    }
  } catch (error) {
    // Ignorar errores de lectura
  }
  
  return info;
}

// ============================================
// 8. LIMPIAR TODOS LOS FLAGS (para reinicio)
// ============================================
export function limpiarTodosLosFlags() {
  eliminarFlagActivo();
  limpiarFlagDetener();
  console.log('🧹 Todos los flags limpiados');
}

// Exportar rutas por si se necesitan
export const rutas = {
  flagsDir: FLAGS_DIR,
  flagActivo: FLAG_ACTIVO,
  flagDetener: FLAG_DETENER
};