import * as authService from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";

export async function sendVerificationCodeHandler(req, res, next) {
  try {
    const result = await authService.sendRegistrationCode(req.body);
    sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
}

export async function registerHandler(req, res, next) {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, 201, result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const result = await authService.loginCustomer(req.body);
    sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
}

export async function staffLoginHandler(req, res, next) {
  try {
    const result = await authService.loginStaff(req.body);
    sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPasswordHandler(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body);
    sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordHandler(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    sendSuccess(res, 200, result);
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    sendSuccess(res, 200, user);
  } catch (err) {
    next(err);
  }
}
