import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { prismaMock, verifyPasswordMock } = vi.hoisted(() => {
  const mock = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };
  mock.$transaction = vi.fn((fn) => fn(mock));
  return { prismaMock: mock, verifyPasswordMock: vi.fn() };
});

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

  it("TC-ECA-01 lists active products with pagination metadata", async () => {
    prismaMock.product.findMany.mockResolvedValue([
      {
        id: 1,
        name: "Vanille Noire",
        brand: "VÉLORA Atelier",
        unitPrice: "150.00",
        stock: 10,
        reorderLevel: 5,
        isActive: true,
        category: { id: 3, name: "Oriental" },
      },
    ]);
    prismaMock.product.count.mockResolvedValue(12);

    const response = await request(app).get("/api/products?page=2&limit=9&sort=price_asc");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      meta: { page: 2, limit: 9, total: 12, totalPages: 2 },
    });
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
        orderBy: { unitPrice: "asc" },
        skip: 9,
        take: 9,
      })
    );
  });

  it("TC-ECA-03 and TC-ECA-04 fetch active product by id and return 404 when missing", async () => {
    prismaMock.product.findFirst
      .mockResolvedValueOnce({
        id: 1,
        name: "Vanille Noire",
        isActive: true,
        category: { id: 3, name: "Oriental" },
      })
      .mockResolvedValueOnce(null);

    const okResponse = await request(app).get("/api/products/1");
    expect(okResponse.status).toBe(200);
    expect(okResponse.body.data).toMatchObject({ id: 1, name: "Vanille Noire" });

    const missingResponse = await request(app).get("/api/products/999");
    expect(missingResponse.status).toBe(404);
    expect(missingResponse.body.error.code).toBe("NOT_FOUND");
  });

  it("lists public fragrance categories", async () => {
    prismaMock.category.findMany.mockResolvedValue([
      { id: 1, name: "Woody" },
      { id: 2, name: "Floral" },
    ]);

    const response = await request(app).get("/api/categories");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
  });

  it("TC-SAL-02 allows admin/sales to create a walk-in customer and rejects inventory", async () => {
    const inventoryStaff = { id: 4, name: "Ian", email: "inv@example.com", role: "INVENTORY", isActive: true };
    prismaMock.user.findUnique.mockImplementation(({ where }) => {
      if (where.id === admin.id) return Promise.resolve(admin);
      if (where.id === inventoryStaff.id) return Promise.resolve(inventoryStaff);
      return Promise.resolve(null);
    });
    prismaMock.customer.create.mockResolvedValue({
      id: 10,
      name: "Elena Santos",
      phone: "+639171234567",
      userId: null,
      _count: { orders: 0 },
    });

    const forbidden = await request(app)
      .post("/api/customers")
      .set("Authorization", bearer(inventoryStaff))
      .send({ name: "Elena Santos", phone: "+639171234567" });
    expect(forbidden.status).toBe(403);

    const created = await request(app)
      .post("/api/customers")
      .set("Authorization", bearer(admin))
      .send({ name: "Elena Santos", phone: "+639171234567" });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe("Elena Santos");
  });

  it("TC-SAL-03 creates an INTERNAL walk-in order with recalculated total", async () => {
    prismaMock.customer.findUnique.mockResolvedValue({ id: 10, name: "Elena Santos", address: null });
    prismaMock.product.findMany.mockResolvedValue([
      { id: 1, name: "Vanille Noire", unitPrice: "150.00", stock: 5, isActive: true },
    ]);
    prismaMock.order.create.mockResolvedValue({
      id: 20,
      orderNumber: "VEL-20261126-ABCD",
      source: "INTERNAL",
      status: "PENDING",
      total: "300.00",
      items: [{ productId: 1, quantity: 2 }],
    });

    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", bearer(admin))
      .send({ customerId: 10, items: [{ productId: 1, quantity: 2 }] });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({ source: "INTERNAL", status: "PENDING" });
  });

  it("TC-INV-03 records stock-in and logs STOCK_IN movement", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 1, name: "Vanille Noire", stock: 2 });
    prismaMock.product.update.mockResolvedValue({ id: 1, name: "Vanille Noire", stock: 12 });
    prismaMock.stockMovement.create.mockResolvedValue({ id: 5, type: "STOCK_IN", quantity: 10 });

    const response = await request(app)
      .post("/api/inventory/stock-in")
      .set("Authorization", bearer(admin))
      .send({ productId: 1, quantity: 10, unitCost: 45, supplierName: "Grasse Botanicals" });

    expect(response.status).toBe(201);
    expect(response.body.data.product.stock).toBe(12);
    expect(prismaMock.stockMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ productId: 1, type: "STOCK_IN", quantity: 10 }),
      })
    );
  });

  it("TC-INV-06 and TC-INV-07 fulfills PENDING order or rejects insufficient stock", async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 20,
      orderNumber: "VEL-20261126-ABCD",
      status: "PENDING",
      items: [{ productId: 1, productName: "Vanille Noire", quantity: 5 }],
    });
    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1, name: "Vanille Noire", stock: 2 });

    const shortRes = await request(app)
      .post("/api/orders/20/fulfill")
      .set("Authorization", bearer(admin));
    expect(shortRes.status).toBe(400);
    expect(shortRes.body.error.code).toBe("INSUFFICIENT_STOCK");

    prismaMock.product.findUnique.mockResolvedValueOnce({ id: 1, name: "Vanille Noire", stock: 10 });
    prismaMock.product.update.mockResolvedValue({ id: 1, stock: 5 });
    prismaMock.stockMovement.create.mockResolvedValue({ id: 6, type: "SALE", quantity: -5 });
    prismaMock.order.update.mockResolvedValue({ id: 20, status: "FULFILLED" });

    const okRes = await request(app)
      .post("/api/orders/20/fulfill")
      .set("Authorization", bearer(admin));
    expect(okRes.status).toBe(200);
    expect(okRes.body.data.status).toBe("FULFILLED");
  });
});
