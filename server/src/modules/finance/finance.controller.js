import * as financeService from "./finance.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function dashboardHandler(_req, res, next) {
  try {
    const summary = await financeService.getDashboardSummary();
    sendSuccess(res, 200, summary);
  } catch (err) {
    next(err);
  }
}
