import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { paginationMeta, parsePagination } from "../../utils/response.js";

function createServiceError(statusCode, code, message, details) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  if (details) err.details = details;
  return err;
}

export async function listOrders(query) {
  const { status, source, paymentStatus, search } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (status) where.status = status;
  if (source) where.source = source;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        items: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function createWalkInOrder(staffUserId, { customerId, deliveryAddress, items }) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw createServiceError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
    }

    const productIds = items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, unitPrice: true, stock: true, isActive: true },
    });
    const productsById = new Map(products.map((p) => [p.id, p]));

    const orderLines = [];
    let total = new Prisma.Decimal(0);

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product || !product.isActive) {
        throw createServiceError(400, "PRODUCT_UNAVAILABLE", "Selected product is unavailable.");
      }
      if (product.stock < item.quantity) {
        throw createServiceError(
          400,
          "INSUFFICIENT_STOCK",
          `${product.name} has only ${product.stock} bottles in stock.`
        );
      }
      const unitPrice = new Prisma.Decimal(product.unitPrice.toString());
      const lineTotal = unitPrice.mul(item.quantity);
      total = total.add(lineTotal);
      orderLines.push({
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const orderNumber = `VEL-${datePart}-${randomBytes(4).toString("hex").toUpperCase()}`;

    return tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        source: "INTERNAL",
        createdById: staffUserId,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        deliveryAddress: deliveryAddress || customer.address || "Walk-in Boutique Pickup",
        total,
        items: { create: orderLines },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        items: true,
      },
    });
  });
}

export async function cancelOrder(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw createServiceError(404, "NOT_FOUND", "Order not found.");
  }
  if (order.status !== "PENDING") {
    throw createServiceError(
      400,
      "INVALID_ORDER_STATE",
      "Only PENDING orders can be cancelled."
    );
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
    include: {
      customer: { select: { id: true, name: true, phone: true, email: true } },
      items: true,
    },
  });
}

export async function fulfillOrder(orderId, staffUserId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw createServiceError(404, "NOT_FOUND", "Order not found.");
    }
    if (order.status !== "PENDING") {
      throw createServiceError(
        400,
        "INVALID_ORDER_STATE",
        "Only PENDING orders can be fulfilled."
      );
    }

    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        throw createServiceError(
          400,
          "INSUFFICIENT_STOCK",
          `Insufficient stock for ${item.productName}. Available: ${product?.stock ?? 0}, required: ${item.quantity}.`
        );
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "SALE",
          quantity: -item.quantity,
          referenceOrderId: order.id,
          performedById: staffUserId,
          reason: `Fulfilled order ${order.orderNumber}`,
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: "FULFILLED",
        fulfilledAt: new Date(),
        fulfilledById: staffUserId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        items: true,
      },
    });
  });
}
