import * as ordersService from "./orders.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function listOrdersHandler(req, res, next) {
  try {
    const result = await ordersService.listOrders(req.query);
    sendSuccess(res, 200, result.items, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function createOrderHandler(req, res, next) {
  try {
    const order = await ordersService.createWalkInOrder(req.user.id, req.body);
    sendSuccess(res, 201, order);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrderHandler(req, res, next) {
  try {
    const order = await ordersService.cancelOrder(req.params.id);
    sendSuccess(res, 200, order);
  } catch (err) {
    next(err);
  }
}

export async function fulfillOrderHandler(req, res, next) {
  try {
    const order = await ordersService.fulfillOrder(req.params.id, req.user.id);
    sendSuccess(res, 200, order);
  } catch (err) {
    next(err);
  }
}
