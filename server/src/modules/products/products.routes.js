import { Router } from "express";
import { validateQuery } from "../../middleware/validate.js";
import { productQuerySchema } from "./products.schemas.js";
import { listProductsHandler } from "./products.controller.js";

const router = Router();

router.get("/", validateQuery(productQuerySchema), listProductsHandler);

export default router;
