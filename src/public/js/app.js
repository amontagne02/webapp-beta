// ============================================
// POS MÓVIL - Lógica de la aplicación
// ============================================

// Configuración
const API_URL = window.location.origin;

// Estado de la aplicación
let productos = [];
let carrito = [];

// Elementos del DOM
const productosContainer = document.getElementById("productosContainer");
const carritoLista = document.getElementById("carritoLista");
const totalItems = document.getElementById("totalItems");
const totalPrecio = document.getElementById("totalPrecio");
const totalPagarSpan = document.getElementById("totalPagar");
const efectivoInput = document.getElementById("efectivo");
const transferenciaInput = document.getElementById("transferencia");
const btnPagar = document.getElementById("btnPagar");
const mensajeDiv = document.getElementById("mensaje");
const searchInput = document.getElementById("searchInput");
const modalVuelto = document.getElementById("modalVuelto");
const modalVueltoMensaje = document.getElementById("modalVueltoMensaje");
const modalTotal = document.getElementById("modalTotal");
const modalPagado = document.getElementById("modalPagado");
const modalVueltoMonto = document.getElementById("modalVueltoMonto");
const modalCancelar = document.getElementById("modalCancelar");
const modalConfirmar = document.getElementById("modalConfirmar");

// ============================================
// VARIABLES DEL MODAL
// ============================================
let resolverModal = null;

// ============================================
// FUNCIÓN PARA MOSTRAR MODAL DE VUELTO
// ============================================
function mostrarModalVuelto(total, pagado, vuelto) {
  if (!modalVuelto) {
    return Promise.resolve(
      confirm(
        `Vuelto a entregar: $${Math.round(vuelto)}. Confirmas que entregaste el vuelto?`,
      ),
    );
  }

  return new Promise((resolve) => {
    resolverModal = resolve;
    modalVueltoMensaje.textContent =
      "Verifica el monto y confirma la entrega del vuelto.";
    modalTotal.textContent = `$${Math.round(total)}`;
    modalPagado.textContent = `$${Math.round(pagado)}`;
    modalVueltoMonto.textContent = `$${Math.round(vuelto)}`;
    modalVuelto.classList.remove("hidden");
    modalConfirmar.focus();
  });
}

function cerrarModalVuelto(confirmado) {
  if (!modalVuelto || resolverModal === null) return;
  const resolver = resolverModal;
  resolverModal = null;
  modalVuelto.classList.add("hidden");
  resolver(confirmado);
}
// ============================================
// 1. CARGAR PRODUCTOS
// ============================================
async function cargarProductos() {
  try {
    mostrarMensaje("Cargando productos...", "info");

    console.log("📡 Solicitando productos a:", `${API_URL}/productos`);

    const response = await fetch(`${API_URL}/productos`);
    console.log("📡 Respuesta status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📦 Datos recibidos:", data);

    if (Array.isArray(data)) {
      productos = data;
    } else if (data.productos && Array.isArray(data.productos)) {
      productos = data.productos;
    } else {
      console.error("Formato de datos inesperado:", data);
      productos = [];
    }

    console.log(`📦 ${productos.length} productos procesados`);

    renderizarProductos(productos);
    mostrarMensaje(`${productos.length} productos cargados`, "exito", 2000);
  } catch (error) {
    console.error("❌ Error detallado:", error);
    mostrarMensaje("Error al cargar productos: " + error.message, "error");
    productosContainer.innerHTML =
      '<p class="error">No se pudieron cargar los productos</p>';
  }
}

// ============================================
// 2. RENDERIZAR PRODUCTOS
// ============================================
// ============================================
// 2. RENDERIZAR PRODUCTOS (CON BOTÓN -)
// ============================================
function renderizarProductos(lista) {
  if (!lista || lista.length === 0) {
    productosContainer.innerHTML =
      '<p class="info">No hay productos disponibles</p>';
    return;
  }

  console.log("🎨 Renderizando productos:", lista.length);

  let html = "";

  for (let i = 0; i < lista.length; i++) {
    const producto = lista[i];

    const codigo = producto.codigo || "";
    const nombre = producto.producto || producto.nombre || "Producto";
    const precio = producto.precio || 0;
    const stock = producto.disponibilidad || producto.stock || 0;
    const sinStock = stock <= 0;

    // Verificar si el producto está en el carrito
    const itemEnCarrito = carrito.find((item) => item.codigo === codigo);
    const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    const codigoEscapado = codigo.replace(/"/g, "&quot;");

    html += '<div class="producto-card" data-codigo="' + codigo + '">';
    html += '<div class="producto-info">';
    html += "<h3>" + nombre + "</h3>";
    html += '<div class="precio">$' + Math.round(precio) + "</div>";
    html +=
      '<div class="stock">Stock: ' +
      stock +
      (sinStock ? " (Sin stock)" : "") +
      "</div>";
    html += "</div>";

    html += '<div class="producto-actions">';

    // En la parte de los botones, debe quedar así:

    // Botón DISMINUIR (-)
    if (cantidadEnCarrito > 0) {
      html +=
        '<button class="btn-cantidad btn-disminuir" onclick="disminuirCantidad(\'' +
        codigoEscapado +
        "')\">−</button>";
    } else {
      html += '<div style="width: 48px; height: 48px;"></div>';
    }

    // Contador
    html +=
      '<span class="cantidad-seleccionada" id="cant-' +
      codigo +
      '">' +
      cantidadEnCarrito +
      "</span>";

    // Botón AUMENTAR (+)
    const puedeSumar = stock > 0 && cantidadEnCarrito < stock;
    html +=
      '<button class="btn-cantidad" ' +
      (puedeSumar ? "" : "disabled ") +
      'onclick="agregarAlCarrito(\'' +
      codigoEscapado +
      "')\">+</button>";

    html += "</div>"; // Cierra producto-actions
    html += "</div>"; // Cierra producto-card
  }

  productosContainer.innerHTML = html;
  console.log("✅ Productos renderizados con botones -");
}

// ============================================
// 3. AGREGAR AL CARRITO
// ============================================
window.agregarAlCarrito = (codigo) => {
  console.log("➕ Agregando producto con código:", codigo);

  const producto = productos.find((p) => p.codigo == codigo);

  if (!producto) {
    console.error("❌ Producto no encontrado:", codigo);
    mostrarMensaje("Error: producto no encontrado", "error");
    return;
  }

  const itemExistente = carrito.find((item) => item.codigo === codigo);
  const stock = producto.disponibilidad || producto.stock || 0;
  if (stock <= 0) {
    mostrarMensaje("Sin stock", "error", 2000);
    return;
  }

  if (itemExistente) {
    if (itemExistente.cantidad < stock) {
      itemExistente.cantidad++;
    } else {
      mostrarMensaje("Stock insuficiente", "error", 2000);
      return;
    }
  } else {
    carrito.push({
      codigo: codigo,
      nombre: producto.producto || producto.nombre,
      precio: producto.precio || 0,
      cantidad: 1,
      maxStock: stock,
    });
  }

  actualizarVistaCarrito();
  renderizarProductos(productos);
  actualizarContadorProducto(codigo);
};

// ============================================
// 3B. DISMINUIR CANTIDAD DEL CARRITO
// ============================================
window.disminuirCantidad = (codigo) => {
  console.log("➖ Disminuyendo producto con código:", codigo);

  const index = carrito.findIndex((item) => item.codigo === codigo);

  if (index !== -1) {
    if (carrito[index].cantidad > 1) {
      // Si hay más de 1, disminuir en 1
      carrito[index].cantidad--;
      console.log(`🔽 Nueva cantidad: ${carrito[index].cantidad}`);
    } else {
      // Si es 1, eliminar del carrito
      console.log("🗑️ Eliminando producto (cantidad llegó a 0)");
      carrito.splice(index, 1);
    }
  }

  actualizarVistaCarrito();
  renderizarProductos(productos);
  actualizarContadorProducto(codigo);
};

// ============================================
// 4. ELIMINAR DEL CARRITO
// ============================================
window.eliminarItemCarrito = (codigo) => {
  console.log("🗑️ Eliminando producto con código:", codigo);

  carrito = carrito.filter((item) => item.codigo !== codigo);

  actualizarVistaCarrito();
  actualizarContadorProducto(codigo);
};

// ============================================
// 5. ACTUALIZAR CONTADOR DE PRODUCTO
// ============================================
function actualizarContadorProducto(codigo) {
  const item = carrito.find((i) => i.codigo === codigo);
  const span = document.getElementById(`cant-${codigo}`);
  if (span) {
    span.textContent = item ? item.cantidad : 0;
  }
}

// ============================================
// 6. ACTUALIZAR VISTA DEL CARRITO
// ============================================

function actualizarVistaCarrito() {
  const totalProductos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalPagar = carrito.reduce(
    (sum, item) => sum + item.cantidad * item.precio,
    0,
  );

  // Actualizar resumen
  totalItems.textContent = `${totalProductos} ${totalProductos === 1 ? "producto" : "productos"}`;
  totalPrecio.textContent = `$${Math.round(totalPagar)}`;
  totalPagarSpan.textContent = `$${Math.round(totalPagar)}`;

  // Si el carrito está vacío
  if (carrito.length === 0) {
    carritoLista.innerHTML =
      '<li style="text-align: center; padding: 24px; color: var(--text-secondary);">🛒 Carrito vacío</li>';
    btnPagar.disabled = true;
    cerrarCarrito();
    return;
  }

  // Generar HTML para cada producto
  let html = "";

  for (let i = 0; i < carrito.length; i++) {
    const item = carrito[i];

    // Escapar comillas en el código
    const codigoEscapado = item.codigo.replace(/"/g, "&quot;");
    const subtotal = Math.round(item.cantidad * item.precio);

    // Construir cada item del carrito
    html += '<li class="carrito-item">';

    // Información del producto (lado izquierdo)
    html += '<div class="carrito-item-info">';
    html += '<div class="carrito-item-nombre">' + item.nombre + "</div>";
    html +=
      '<div class="carrito-item-detalle">$' +
      Math.round(item.precio) +
      " c/u</div>";
    html += "</div>";

    // Controles y subtotal (lado derecho)
    html += '<div style="display: flex; align-items: center; gap: 8px;">';

    // Subtotal
    html += '<span class="carrito-item-subtotal">$' + subtotal + "</span>";

    // En la parte de los controles del carrito:

    // Botón DISMINUIR
    html +=
      '<button class="btn-cantidad-carrito" onclick="disminuirCantidad(\'' +
      codigoEscapado +
      "')\">−</button>";

    // Cantidad actual
    html +=
      '<span class="cantidad-seleccionada" style="min-width: 36px;">' +
      item.cantidad +
      "</span>";

    // Botón AUMENTAR
    html +=
      '<button class="btn-cantidad-carrito" onclick="agregarAlCarrito(\'' +
      codigoEscapado +
      "')\">+</button>";

    // Botón ELIMINAR
    html +=
      '<button class="btn-eliminar-item" onclick="eliminarItemCarrito(\'' +
      codigoEscapado +
      "')\">✕</button>";

    html += "</div>"; // Cierra el div de controles
    html += "</li>"; // Cierra el item
  }

  // Insertar el HTML generado
  carritoLista.innerHTML = html;

  // Habilitar botón de pago
  btnPagar.disabled = false;

  // Actualizar cálculo de pago
  calcularPago();
}

// ============================================
// 7. CÁLCULO DE PAGO
// ============================================
function calcularPago() {
  const total = carrito.reduce(
    (sum, item) => sum + item.cantidad * item.precio,
    0,
  );
  const efectivo = parseInt(efectivoInput.value) || 0;
  const transferencia = parseInt(transferenciaInput.value) || 0;

  const pagado = efectivo + transferencia;
  const diferencia = pagado - total;

  btnPagar.classList.remove("exacto", "falta", "vuelto");

  if (Math.abs(diferencia) < 0.01) {
    btnPagar.textContent = "Pagar ✓";
    btnPagar.classList.add("exacto");
    btnPagar.disabled = false;
  } else if (diferencia > 0) {
    btnPagar.textContent = `Vuelto $${Math.round(diferencia)}`;
    btnPagar.classList.add("vuelto");
    btnPagar.disabled = false;
  } else {
    btnPagar.textContent = `Faltan $${Math.round(Math.abs(diferencia))}`;
    btnPagar.classList.add("falta");
    btnPagar.disabled = true;
  }
}

// ============================================
// 8. FINALIZAR VENTA
// ============================================

async function finalizarVenta() {
  if (carrito.length === 0) {
    mostrarMensaje("Agrega productos al carrito", "error");
    return;
  }

  let efectivo = parseInt(efectivoInput.value) || 0;
  let transferencia = parseInt(transferenciaInput.value) || 0;
  const total = carrito.reduce(
    (sum, item) => sum + item.cantidad * item.precio,
    0,
  );

  const pagado = efectivo + transferencia;
  let vuelto = pagado - total;

  // 1. Si falta dinero, NO permitir
  if (vuelto < 0) {
    mostrarMensaje(`❌ Faltan $${Math.abs(vuelto)}`, "error");
    return;
  }

  // 2. Si hay vuelto, preguntar con modal
  if (vuelto > 0) {
    const confirmar = await mostrarModalVuelto(total, pagado, vuelto);

    if (!confirmar) {
      mostrarMensaje("Venta cancelada", "info", 2000);
      return;
    }

    // 3. AJUSTAR EFECTIVO AL MONTO EXACTO
    if (efectivo >= vuelto) {
      efectivo = efectivo - vuelto;
    } else {
      efectivo = 0;
      transferencia = transferencia - (vuelto - efectivo);
    }

    efectivoInput.value = efectivo;
    transferenciaInput.value = transferencia;

    console.log(`💰 Vuelto entregado. Nuevo efectivo: $${efectivo}`);
  }

  // 4. Procesar venta con los montos ajustados
  try {
    btnPagar.disabled = true;
    btnPagar.textContent = "Procesando...";

    const ventaData = {
      pago: { efectivo, transferencia },
      productos: carrito.map((item) => ({
        codigo: item.codigo,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
      })),
    };

    console.log("📤 Enviando venta (montos ajustados):", ventaData);

    const response = await fetch(`${API_URL}/ventas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ventaData),
    });

    const result = await response.json();
    console.log("📥 Respuesta del servidor:", result);

    if (response.ok) {
      mostrarMensaje(`✅ Venta #${result.facturaId} registrada`, "exito", 3000);

      carrito = [];
      efectivoInput.value = "0";
      transferenciaInput.value = "0";
      actualizarVistaCarrito();
      cargarProductos();
      cerrarCarrito();
    } else {
      mostrarMensaje(result.error || "Error en la venta", "error");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    mostrarMensaje("Error de conexión", "error");
  } finally {
    btnPagar.disabled = false;
    calcularPago();
  }
}
// ============================================
// 9. UTILIDADES
// ============================================
function mostrarMensaje(texto, tipo, duracion = 3000) {
  mensajeDiv.textContent = texto;
  mensajeDiv.className = `mensaje ${tipo}`;
  mensajeDiv.classList.remove("hidden");

  if (duracion > 0) {
    setTimeout(() => {
      mensajeDiv.classList.add("hidden");
    }, duracion);
  }
}

window.toggleCarrito = () => {
  const contenido = document.getElementById("carritoContenido");
  const icono = document.getElementById("carritoIcono");
  contenido.classList.toggle("abierto");
  icono.classList.toggle("abierto");
};

window.cerrarCarrito = () => {
  const contenido = document.getElementById("carritoContenido");
  const icono = document.getElementById("carritoIcono");
  contenido.classList.remove("abierto");
  icono.classList.remove("abierto");
};

if (modalCancelar) {
  modalCancelar.addEventListener("click", () => cerrarModalVuelto(false));
}

if (modalConfirmar) {
  modalConfirmar.addEventListener("click", () => cerrarModalVuelto(true));
}

if (modalVuelto) {
  modalVuelto.addEventListener("click", (e) => {
    if (e.target === modalVuelto) cerrarModalVuelto(false);
  });
}

document.addEventListener("keydown", (e) => {
  if (!modalVuelto || modalVuelto.classList.contains("hidden")) return;
  if (e.key === "Escape") cerrarModalVuelto(false);
  if (e.key === "Enter") cerrarModalVuelto(true);
});

// ============================================
// 10. FILTRO DE BÚSQUEDA
// ============================================
searchInput.addEventListener("input", (e) => {
  const termino = e.target.value.toLowerCase();
  const filtrados = productos.filter(
    (p) =>
      (p.producto || p.nombre || "").toLowerCase().includes(termino) ||
      (p.codigo || "").toString().includes(termino),
  );
  renderizarProductos(filtrados);
});

// ============================================
// 11. EVENT LISTENERS
// ============================================
efectivoInput.addEventListener("input", calcularPago);
transferenciaInput.addEventListener("input", calcularPago);
btnPagar.addEventListener("click", finalizarVenta);

// ============================================
// 12. INICIALIZACIÓN
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  cargarProductos();
  actualizarVistaCarrito();
});

function probarModalManual() {
  mostrarModalVuelto(1000, 1100, 100);
}
