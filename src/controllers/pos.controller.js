// ============================================
// CONTROLLER: Productos (POS) - Versión RANGO
// ============================================
// Endpoint: GET /api/productos
// Lee desde un rango de celdas (no tabla formal)
// ============================================

import { abrirExcel, obtenerHojaPorNombre } from "../utils/excelHelper.js";

const NOMBRE_HOJA = "Productos"; // Ajusta al nombre real de tu hoja

/**
 * Normaliza nombres de campo
 */
const normalizarCampo = (texto) => {
  if (!texto) return "campo_" + Date.now();

  return texto
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[áéíóúüñ]/g, (letra) => {
      const map = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u", ñ: "n" };
      return map[letra] || letra;
    })
    .replace(/[^a-z0-9_]/g, "");
};

/**
 * Filtra filas que están completamente vacías
 */
const filaTieneDatos = (fila) => {
  return fila.some(
    (celda) => celda !== null && celda !== undefined && celda !== "",
  );
};

export const getProductos = async (req, res) => {
  try {
    // 1. Abrir Excel
    const { workbook } = await abrirExcel();

    // 2. Obtener la hoja de productos
    const hoja = obtenerHojaPorNombre(workbook, NOMBRE_HOJA);

    // 3. Obtener rango utilizado
    const rango = hoja.usedRange();
    if (!rango) {
      return res
        .status(404)
        .json({ error: "No hay datos en la hoja de productos" });
    }

    // 4. Obtener matriz de valores
    const datos = rango.value();

    // 5. Validar que hay al menos encabezados
    if (datos.length < 2) {
      return res.status(404).json({ error: "No hay productos cargados" });
    }

    // 6. Extraer encabezados (primera fila)
    const encabezados = datos[0];

    // 7. Filtrar filas vacías y mapear a objetos
    const productos = datos
      .slice(1) // Saltamos encabezados
      .filter((fila) => filaTieneDatos(fila)) // Solo filas con contenido
      .map((fila) => {
        const producto = {};

        encabezados.forEach((encabezado, i) => {
          const campo = normalizarCampo(encabezado);
          producto[campo] =
            fila[i] !== undefined && fila[i] !== "" ? fila[i] : null;
        });

        return producto;
      });

    // 8. Responder con JSON
    res.json({
      total: productos.length,
      productos: productos,
    });
  } catch (error) {
    console.error("❌ Error en getProductos:", error.message);
    res.status(500).json({
      error: "Error al obtener productos",
      detalle: error.message,
    });
  }
};
