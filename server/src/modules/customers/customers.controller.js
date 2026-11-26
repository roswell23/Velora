import * as customersService from "./customers.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function listCustomersHandler(req, res, next) {
  try {
    const result = await customersService.listCustomers(req.query);
    sendSuccess(res, 200, result.items, result.meta);
  } catch (err) {
    next(err);
  }
}

export async function createCustomerHandler(req, res, next) {
  try {
    const customer = await customersService.createCustomer(req.body);
    sendSuccess(res, 201, customer);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerHandler(req, res, next) {
  try {
    const customer = await customersService.updateCustomer(req.params.id, req.body);
    sendSuccess(res, 200, customer);
  } catch (err) {
    next(err);
  }
}
