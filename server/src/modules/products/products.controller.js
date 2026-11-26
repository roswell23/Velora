import * as productsService from "./products.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function listProductsHandler(req, res, next) {
  try {
    const result = await productsService.listProducts(req.query, true);
    sendSuccess(res, 200, result.items, result.meta);
  } catch (err) {
    next(err);
  }
}
