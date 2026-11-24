import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { prismaMock, verifyPasswordMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
  verifyPasswordMock: vi.fn(),
}));

vi.mock("../src/utils/prisma.js", () => ({ default: prismaMock }));
vi.mock("../src/utils/password.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: verifyPasswordMock,
}));

import app from "../src/app.js";
import { signToken } from "../src/utils/jwt.js";

const customer = {
  id: 21,
  name: "Jane Doe",
  email: "jane@example.com",
  role: "CUSTOMER",
  isActive: true,
  passwordHash: "stored-hash",
};

const admin = {
  id: 1,
  name: "Velora Admin",
  email: "admin@example.com",
  role: "ADMIN",
  isActive: true,
};

function bearer(user) {
  return `Bearer ${signToken(user)}`;
}

describe("API verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.email === customer.email) return Promise.resolve(customer);
      if (where.id === customer.id) return Promise.resolve(customer);
      if (where.id === admin.id) return Promise.resolve(admin);
      return Promise.resolve(null);
    });
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);
    verifyPasswordMock.mockResolvedValue(true);
  });

  it("returns the standard health envelope", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: { status: "ok", service: "VÉLORA API" },
    });
  });

  it("rejects invalid login input before querying the database", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password: "",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns a generic error for invalid customer credentials", async () => {
    verifyPasswordMock.mockResolvedValue(false);

    const response = await request(app).post("/api/auth/login").send({
      email: customer.email,
      password: "incorrect-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    });
  });

  it("TC-AUTH-04 rejects customer accounts on the staff login endpoint", async () => {
    const response = await request(app).post("/api/auth/staff-login").send({
      email: customer.email,
      password: "correct-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe("Invalid email or password.");
    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });

  it("TC-AUTH-03 returns a safe customer identity and token after valid login", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: customer.email,
      password: "correct-password",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      id: customer.id,
      email: customer.email,
      role: "CUSTOMER",
    });
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.token).toEqual(expect.any(String));
  });

  it("TC-ADM-01 requires an admin role for user management", async () => {
    const noToken = await request(app).get("/api/users");
    const customerToken = await request(app)
      .get("/api/users")
      .set("Authorization", bearer(customer));

    expect(noToken.status).toBe(401);
    expect(customerToken.status).toBe(403);
    expect(customerToken.body.error.code).toBe("FORBIDDEN");
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("TC-ADM-01 allows an admin to list staff users with pagination metadata", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { ...admin, createdAt: "2026-01-01T00:00:00.000Z" },
    ]);
    prismaMock.user.count.mockResolvedValue(1);

    const response = await request(app)
      .get("/api/users?page=1&limit=10")
      .set("Authorization", bearer(admin));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 })
    );
  });
});
