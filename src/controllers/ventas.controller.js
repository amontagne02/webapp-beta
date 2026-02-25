// ============================================
// CONTROLLER: Ventas (POS)
// ============================================
// Endpoint: POST /api/ventas
// Registra una venta con múltiples productos en hoja "Pendientes"
// ============================================

import {
  abrirExcel,
  obtenerHojaPorNombre,
  generarFacturaIdExcel,
  escribirLineaVenta,
  guardarExcel,
} from "../utils/excelHelper.js";

const NOMBRE_HOJA_PENDIENTES = "Pendientes";

/**
 * Valida que el pago cubra el total de la venta
 */
const validarPago = (productos, efectivo, transferencia) => {
  const totalCalculado = productos.reduce(
    (sum, p) => sum + p.cantidad * p.precio,
    0,
  );

  const totalPagado = efectivo + transferencia;

  return {
    valido: Math.abs(totalPagado - totalCalculado) < 0.01, // Tolerancia por decimales
    totalCalculado,
    totalPagado,
    diferencia: totalPagado - totalCalculado,
  };
};

export const crearVenta = async (req, res) => {
  try {
    // 1. Extraer datos del body
    const { pago, productos } = req.body;

    // 2. Validaciones básicas
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res
        .status(400)
        .json({ error: "Debe incluir al menos un producto" });
    }

    if (
      !pago ||
      typeof pago.efectivo !== "number" ||
      typeof pago.transferencia !== "number"
    ) {
      return res.status(400).json({
        error: "Debe incluir pago con efectivo y transferencia (pueden ser 0)",
      });
    }

    // 3. Validar que el pago cubre el total
    const validacion = validarPago(
      productos,
      pago.efectivo,
      pago.transferencia,
    );

    if (!validacion.valido) {
      return res.status(400).json({
        error: "El monto pagado no coincide con el total de la venta",
        total: validacion.totalCalculado,
        pagado: validacion.totalPagado,
        diferencia: validacion.diferencia,
      });
    }

    // 4. Abrir Excel
    const { workbook, hoja } = await abrirExcel(); // Por defecto abre "Pendientes"

    // 5. Generar nuevo FacturaID
    const facturaId = generarFacturaIdExcel(hoja);

    // 6. Preparar fecha/hora
    const fechaHora = new Date().toISOString();

    // 7. Escribir una línea por cada producto
    const lineasEscritas = [];

    for (const producto of productos) {
      const subtotal = producto.cantidad * producto.precio;

      const datosVenta = {
        facturaId,
        fechaHora,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        cantidad: producto.cantidad,
        precioUnitario: producto.precio,
        subtotal,
        efectivo: pago.efectivo,
        transferencia: pago.transferencia,
      };

      const fila = escribirLineaVenta(hoja, datosVenta);
      lineasEscritas.push({ producto: producto.nombre, fila });
    }

    // 8. Guardar Excel
    await guardarExcel(workbook);

    // 9. Responder éxito
    res.status(201).json({
      success: true,
      mensaje: "Venta registrada correctamente",
      facturaId,
      total: validacion.totalCalculado,
      productos: productos.map((p) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        subtotal: p.cantidad * p.precio,
      })),
      lineasEscritas: lineasEscritas.length,
    });
  } catch (error) {
    console.error("❌ Error en crearVenta:", error.message);
    res.status(500).json({
      error: "Error al registrar la venta",
      detalle: error.message,
    });
  }
};
