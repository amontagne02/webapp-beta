import {
  abrirExcel,
  generarFacturaIdExcel,
  escribirLineaVenta,
  actualizarStock,
  guardarExcel,
} from "../utils/excelHelper.js";

export const crearVenta = async (req, res) => {
  try {
    const { pago, productos } = req.body;

    // Validaciones básicas
    if (!productos?.length) {
      return res
        .status(400)
        .json({ error: "Debe incluir al menos un producto" });
    }

    // Calcular total
    const totalCalculado = productos.reduce(
      (sum, p) => sum + p.cantidad * p.precio,
      0,
    );

    // Validar pago
    const totalPagado = pago.efectivo + pago.transferencia;
    if (Math.abs(totalPagado - totalCalculado) > 0.01) {
      return res.status(400).json({
        error: "El monto pagado no coincide con el total",
        total: totalCalculado,
        pagado: totalPagado,
      });
    }

    // ===== PROCESAR VENTA (TODO O NADA) =====
    const { workbook, hoja } = await abrirExcel();

    // 1. Verificar stock ANTES de procesar
    const erroresStock = [];
    for (const producto of productos) {
      const stockDisponible = await verificarStock(workbook, producto.codigo);
      if (stockDisponible < producto.cantidad) {
        erroresStock.push({
          codigo: producto.codigo,
          nombre: producto.nombre,
          disponible: stockDisponible,
          solicitado: producto.cantidad,
        });
      }
    }

    // Si hay errores de stock, cancelar TODO
    if (erroresStock.length > 0) {
      return res.status(400).json({
        error: "Stock insuficiente para algunos productos",
        productos: erroresStock,
      });
    }

    // 2. Generar FacturaID
    const facturaId = generarFacturaIdExcel(hoja);
    const fechaHora = new Date().toISOString();

    // 3. Escribir líneas en Pendientes
    for (const producto of productos) {
      const subtotal = producto.cantidad * producto.precio;
      await escribirLineaVenta(hoja, {
        facturaId,
        fechaHora,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        cantidad: producto.cantidad,
        precioUnitario: producto.precio,
        subtotal,
        efectivo: pago.efectivo,
        transferencia: pago.transferencia,
      });
    }

    // 4. ACTUALIZAR STOCK en hoja Productos
    for (const producto of productos) {
      await actualizarStock(workbook, producto.codigo, producto.cantidad);
    }

    // 5. Guardar TODO (un solo save)
    await guardarExcel(workbook);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      facturaId,
      total: totalCalculado,
      productos: productos.map((p) => ({
        codigo: p.codigo,
        nombre: p.nombre,
        cantidad: p.cantidad,
        subtotal: p.cantidad * p.precio,
      })),
    });
  } catch (error) {
    console.error("❌ Error en crearVenta:", error.message);
    res.status(500).json({
      error: "Error al registrar la venta",
      detalle: error.message,
    });
  }
};

// Función auxiliar para verificar stock
async function verificarStock(workbook, codigoProducto) {
  try {
    const hojaProductos = workbook.sheet("Productos");
    let fila = 2;

    while (true) {
      const codigoCelda = hojaProductos.cell(`A${fila}`).value();
      if (!codigoCelda) break;

      if (codigoCelda.toString() === codigoProducto.toString()) {
        return hojaProductos.cell(`C${fila}`).value() || 0;
      }
      fila++;
    }
    return 0;
  } catch (error) {
    console.error("Error verificando stock:", error);
    return 0;
  }
}
