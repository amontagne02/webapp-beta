import { Router } from "express";
import { getProductos } from "../controllers/pos.controller.js";

const router = Router();

// GET /api/productos - Lista todos los productos
router.get("/api/productos", getProductos);

export default router;
