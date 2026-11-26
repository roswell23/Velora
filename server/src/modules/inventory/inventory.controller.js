import * as inventoryService from "./inventory.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function stockInHandler(req, res, next) {
  try {
    const result = await inventoryService.recordStockIn(req.user.id, req.body);
    sendSuccess(res, 201, result);
  } catch (err) {
    next(err);
  }
}

export async function listMovementsHandler(req, res, next) {
  try {
    const result = await inventoryService.listMovements(req.query);
    sendSuccess(res, 200, result.items, result.meta);
  } catch (err) {
    next(err);
  }
}
