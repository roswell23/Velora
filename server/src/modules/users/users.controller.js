import * as usersService from "./users.service.js";
import { sendSuccess, paginationMeta, parsePagination } from "../../utils/response.js";

export async function listUsersHandler(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search } = req.query;
    const { users, total } = await usersService.listUsers({ search, page, limit, skip });
    sendSuccess(res, 200, users, paginationMeta(page, limit, total));
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    sendSuccess(res, 201, user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const user = await usersService.updateUser(id, req.body);
    sendSuccess(res, 200, user);
  } catch (err) {
    next(err);
  }
}
