import * as myService from "./my.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function getProfileHandler(req, res, next) {
  try {
    const profile = await myService.getCustomerProfile(req.user.id);
    sendSuccess(res, 200, profile);
  } catch (err) {
    next(err);
  }
}

export async function createOrderHandler(req, res, next) {
  try {
    const order = await myService.createOnlineOrder(req.user.id, req.body);
    sendSuccess(res, 201, order);
  } catch (err) {
    next(err);
  }
}
