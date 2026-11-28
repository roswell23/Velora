import * as productsService from "./products.service.js";
import { sendError, sendSuccess } from "../../utils/response.js";

export async function listProductsHandler(req, res, next) {
  try {
    const result = await productsService.listProducts(req.query, true);
    sendSuccess(res, 200, result.items, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function listBestSellingProductsHandler(req, res, next) {
  try {
    const products = await productsService.listBestSellingProducts();
    sendSuccess(res, 200, products);
  } catch (err) {
    next(err);
  }
}

export async function getProductHandler(req, res, next) {
  try {
    const product = await productsService.getProductById(req.params.id, true);
    if (!product) {
      return sendError(res, 404, "NOT_FOUND", "Product not found.");
    }
    sendSuccess(res, 200, product);
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(req, res, next) {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body);
    sendSuccess(res, 200, product);
  } catch (err) {
    next(err);
  }
}
