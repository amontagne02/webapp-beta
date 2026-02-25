// ============================================
// UTILS: Excel Helper
// ============================================
// Funciones reutilizables para manejar el Excel intermediario
// ============================================

import XlsxPopulate from "xlsx-populate";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Obtener __dirname equivalente en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta fija al archivo Excel (desde la raíz del proyecto)
const RUTA_EXCEL = path.resolve(__dirname, "..", "..", "data", "datos.xlsx");
const NOMBRE_HOJA = "Pendientes";

// ============================================
// 1. ABRIR EXCEL - Obtiene el workbook y la hoja
// ============================================
export const abrirExcel = async () => {
  try {
    console.log("📂 Abriendo Excel:", RUTA_EXCEL);
    const workbook = await XlsxPopulate.fromFileAsync(RUTA_EXCEL);
    const hoja = workbook.sheet(NOMBRE_HOJA);

    if (!hoja) {
      throw new Error(`No se encontró la hoja "${NOMBRE_HOJA}" en el Excel`);
    }

    return { workbook, hoja, ruta: RUTA_EXCEL };
  } catch (error) {
    console.error("❌ Error abriendo Excel:", error.message);
    throw new Error(`No se pudo abrir el Excel: ${error.message}`);
  }
};

// ============================================
// 2. GUARDAR EXCEL - Persiste los cambios
// ============================================
export const guardarExcel = async (workbook) => {
  try {
    await workbook.toFileAsync(RUTA_EXCEL);
    console.log("✅ Excel guardado correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error guardando Excel:", error.message);
    throw new Error(`No se pudo guardar el Excel: ${error.message}`);
  }
};

// ============================================
// 3. GENERAR FACTURA ID ESTILO EXCEL (fecha + consecutivo)
// ============================================
// Formato: [5 dígitos fecha serial] + [5 dígitos consecutivo]
// Ejemplo: 4537100023 (donde 45371 = fecha, 00023 = factura 23 del día)
// ============================================

/**
 * Convierte una fecha JS a fecha serial de Excel
 * Excel cuenta días desde 1/1/1900 (con el bug del año 1900 incluido)
 */
const fechaATimestampExcel = (fecha) => {
  // Fecha base de Excel (1/1/1900)
  const fechaBase = new Date(1900, 0, 1); // 1 Enero 1900

  // Diferencia en milisegundos
  const diffMs = fecha - fechaBase;

  // Convertir a días (Excel incluye el 29/2/1900 que no existe, pero lo respetamos)
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Ajuste por el bug de Excel (considera 1900 como bisiesto)
  // Si la fecha es posterior al 28/2/1900, sumamos 1
  const fechaLimite = new Date(1900, 1, 28); // 28 Feb 1900
  const ajuste = fecha > fechaLimite ? 1 : 0;

  return diffDias + 2 + ajuste; // +2 por cómo maneja JS las fechas
};

/**
 * Genera un nuevo FacturaID basado en la fecha actual
 * Busca en la hoja "Pendientes" el último consecutivo del día
 */
export const generarFacturaIdExcel = (hoja, fecha = new Date()) => {
  try {
    // 1. Convertir fecha a número Excel (5 dígitos)
    const fechaSerial = fechaATimestampExcel(fecha);
    const prefijo = fechaSerial.toString().padStart(5, "0"); // Aseguramos 5 dígitos

    console.log(
      `📅 Fecha: ${fecha.toLocaleDateString()} → Serial: ${fechaSerial} (prefijo: ${prefijo})`,
    );

    // 2. Buscar en columna A (FacturaID) todos los IDs que empiecen con el prefijo
    let maxSufijo = 0;
    let fila = 2; // Empezamos después de encabezados

    while (true) {
      const facturaIdCompleto = hoja.cell(`A${fila}`).value();

      // Si no hay más datos, salimos
      if (!facturaIdCompleto) break;

      // Convertir a string para manipular
      const facturaIdStr = facturaIdCompleto.toString();

      // Verificar si empieza con nuestro prefijo
      if (facturaIdStr.startsWith(prefijo)) {
        // Extraer el sufijo (últimos 5 dígitos)
        const sufijo = parseInt(facturaIdStr.slice(-5), 10);

        if (sufijo > maxSufijo) {
          maxSufijo = sufijo;
        }
      }

      fila++;
    }

    // 3. Si no hay facturas hoy, empezamos en 1
    //    Si hay, sumamos 1 al máximo encontrado
    const nuevoSufijo = maxSufijo + 1;

    // 4. Formatear: prefijo + sufijo con 5 dígitos
    const nuevoFacturaId = prefijo + nuevoSufijo.toString().padStart(5, "0");

    console.log(
      `✅ Nuevo FacturaID generado: ${nuevoFacturaId} (sufijo: ${nuevoSufijo})`,
    );

    return nuevoFacturaId;
  } catch (error) {
    console.error("❌ Error generando FacturaID estilo Excel:", error.message);
    throw new Error("No se pudo generar el FacturaID");
  }
};

// ============================================
// 4. ESCRIBIR UNA LÍNEA DE VENTA
// ============================================
export const escribirLineaVenta = (hoja, datosVenta) => {
  try {
    // Encontrar la primera fila vacía
    let fila = 1;
    while (hoja.cell(`A${fila + 1}`).value()) {
      fila++;
    }
    fila++; // Ahora fila es la primera vacía

    const {
      facturaId,
      fechaHora,
      codigoProducto,
      nombreProducto,
      cantidad,
      precioUnitario,
      subtotal,
      efectivo,
      transferencia,
    } = datosVenta;

    // Escribir cada campo en su columna
    hoja.cell(`A${fila}`).value(facturaId); // FacturaID
    hoja.cell(`B${fila}`).value(fechaHora); // FechaHora
    hoja.cell(`C${fila}`).value(codigoProducto); // CodigoProducto
    hoja.cell(`D${fila}`).value(nombreProducto); // Nombre
    hoja.cell(`E${fila}`).value(cantidad); // CantVendida
    hoja.cell(`F${fila}`).value(precioUnitario); // PrecioUnitario
    hoja.cell(`G${fila}`).value(subtotal); // Subtotal
    hoja.cell(`H${fila}`).value(efectivo); // Efectivo
    hoja.cell(`I${fila}`).value(transferencia); // Transferencia
    hoja.cell(`J${fila}`).value(false); // Procesado (FALSE por defecto)

    console.log(`✅ Línea escrita en fila ${fila} para FacturaID ${facturaId}`);
    return fila;
  } catch (error) {
    console.error("❌ Error escribiendo línea de venta:", error.message);
    throw new Error("No se pudo escribir la línea de venta");
  }
};

// ============================================
// 5. VALIDAR QUE EL EXCEL EXISTE (útil al inicio)
// ============================================
export const validarExcelExiste = () => {
  const existe = fs.existsSync(RUTA_EXCEL);

  if (!existe) {
    console.error(`❌ No se encuentra el Excel en: ${RUTA_EXCEL}`);
    console.error("   Asegúrate de crear el archivo en esa ubicación");
    return false;
  }

  console.log(`✅ Excel encontrado en: ${RUTA_EXCEL}`);
  return true;
};

// ============================================
// 6. FUNCIÓN DE PRUEBA (actualizada)
// ============================================
export const probarHelper = async () => {
  console.log("\n🧪 Probando Excel Helper...");

  try {
    // 1. Verificar que el Excel existe
    if (!validarExcelExiste()) {
      console.log("❌ Prueba fallida: Excel no encontrado");
      return;
    }

    // 2. Abrir Excel
    const { workbook, hoja } = await abrirExcel();
    console.log("✅ Excel abierto correctamente");

    // 3. Probar generador de FacturaID estilo Excel
    console.log("\n📋 Probando generador de FacturaID...");
    const facturaId1 = generarFacturaIdExcel(hoja, new Date("2024-01-15")); // Fecha fija para prueba
    console.log(`   FacturaID generado: ${facturaId1}`);

    const facturaId2 = generarFacturaIdExcel(hoja, new Date("2024-01-15")); // Misma fecha
    console.log(`   Segundo ID: ${facturaId2} (debería ser superior)`);

    const facturaId3 = generarFacturaIdExcel(hoja, new Date("2024-01-16")); // Día siguiente
    console.log(`   ID día siguiente: ${facturaId3} (prefijo debe cambiar)`);

    // 4. Escribir una línea de prueba con el nuevo ID
    const datosPrueba = {
      facturaId: facturaId1,
      fechaHora: new Date().toISOString(),
      codigoProducto: 999,
      nombreProducto: "Producto de Prueba",
      cantidad: 1,
      precioUnitario: 100,
      subtotal: 100,
      efectivo: 100,
      transferencia: 0,
    };

    escribirLineaVenta(hoja, datosPrueba);
    console.log("✅ Línea de prueba escrita");

    // 5. Guardar Excel
    await guardarExcel(workbook);
    console.log("✅ Excel guardado");

    console.log("🎉 Prueba completada exitosamente!\n");
  } catch (error) {
    console.error("❌ Prueba fallida:", error.message);
  }
};

// ============================================
// 7. OBTENER HOJA POR NOMBRE (desde un workbook existente)
// ============================================
export const obtenerHojaPorNombre = (workbook, nombreHoja) => {
  try {
    const hoja = workbook.sheet(nombreHoja);

    if (!hoja) {
      throw new Error(`No se encontró la hoja "${nombreHoja}"`);
    }

    console.log(`📄 Hoja "${nombreHoja}" obtenida correctamente`);
    return hoja;
  } catch (error) {
    console.error(`❌ Error obteniendo hoja "${nombreHoja}":`, error.message);
    throw error;
  }
};
