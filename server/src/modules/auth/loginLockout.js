const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000;
const attemptsByLogin = new Map();

function getKey(req) {
  const email = req.body?.email?.trim().toLowerCase();
  return email ? `${req.path}:${email}` : null;
}

function sendLocked(res, retryAfterMs) {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  res.set("Retry-After", String(retryAfterSeconds));
  return res.status(429).json({
    success: false,
    error: {
      code: "LOGIN_LOCKED",
      message: "Too many failed login attempts. Please try again in 10 minutes.",
      details: { retryAfterSeconds },
    },
  });
}

/** Locks an email and login endpoint for ten minutes after five invalid credentials. */
export function loginLockout(req, res, next) {
  const key = getKey(req);
  if (!key) return next();

  const now = Date.now();
  const current = attemptsByLogin.get(key);
  if (current?.lockedUntil > now) return sendLocked(res, current.lockedUntil - now);
  if (current?.lockedUntil && current.lockedUntil <= now) attemptsByLogin.delete(key);

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 401 && body?.error?.code === "INVALID_CREDENTIALS") {
      const currentAttempts = attemptsByLogin.get(key);
      const failures = (currentAttempts?.failures || 0) + 1;
      if (failures >= MAX_FAILED_ATTEMPTS) {
        attemptsByLogin.set(key, { failures, lockedUntil: Date.now() + LOCKOUT_MS });
        return sendLocked(res, LOCKOUT_MS);
      }
      attemptsByLogin.set(key, { failures, lockedUntil: 0 });
    } else if (res.statusCode >= 200 && res.statusCode < 300) {
      attemptsByLogin.delete(key);
    }
    return originalJson(body);
  };

  return next();
}
