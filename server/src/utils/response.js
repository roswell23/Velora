/**
 * Standard API response helpers
 */

/**
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {*} data
 * @param {object} [meta]
 */
export function sendSuccess(res, statusCode, data, meta = undefined) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

/**
 * @param {import("express").Response} res
 * @param {number} statusCode
 * @param {string} code
 * @param {string} message
 * @param {*} [details]
 */
export function sendError(res, statusCode, code, message, details = undefined) {
  const body = { success: false, error: { code, message } };
  if (details) body.error.details = details;
  return res.status(statusCode).json(body);
}

/**
 * Build pagination meta from query params and total count.
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 */
export function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Parse page/limit from query with safe defaults.
 * @param {object} query
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
