import { Router } from "express";
import { validateParams, validateQuery } from "../../middleware/validate.js";
import { productIdParamSchema, productQuerySchema } from "./products.schemas.js";
import { getProductHandler, listProductsHandler } from "./products.controller.js";

const router = Router();

router.get("/", validateQuery(productQuerySchema), listProductsHandler);
router.get("/:id", validateParams(productIdParamSchema), getProductHandler);

export default router;
