import * as categoriesService from "./categories.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function listCategoriesHandler(_req, res, next) {
  try {
    const categories = await categoriesService.listCategories();
    sendSuccess(res, 200, categories);
  } catch (err) {
    next(err);
  }
}
