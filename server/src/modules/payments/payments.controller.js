import * as paymentsService from "./payments.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function recordPaymentHandler(req, res, next) {
  try {
    const payment = await paymentsService.recordPayment(req.user.id, req.body);
    sendSuccess(res, 201, payment);
  } catch (err) {
    next(err);
  }
}
