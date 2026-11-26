import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";

function createServiceError(statusCode, code, message, details) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  if (details) error.details = details;
  return error;
}

export async function getCustomerProfile(userId) {
  const customer = await prisma.customer.findUnique({
    where: { userId },
    select: { id: true, name: true, email: true, phone: true, address: true },
  });

  if (!customer) {
    throw createServiceError(404, "CUSTOMER_NOT_FOUND", "Customer profile not found.");
  }

  return customer;
}

export async function createOnlineOrder(userId, { items, deliveryAddress, phone }) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { userId } });
    if (!customer) {
      throw createServiceError(404, "CUSTOMER_NOT_FOUND", "Customer profile not found.");
    }

    const productIds = items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, unitPrice: true, stock: true, isActive: true },
    });
    const productsById = new Map(products.map((product) => [product.id, product]));
    const orderLines = [];
    let total = new Prisma.Decimal(0);

    for (const item of items) {
      const product = productsById.get(item.productId);
      if (!product || !product.isActive) {
        throw createServiceError(
          400,
          "PRODUCT_UNAVAILABLE",
          "One or more selected fragrances are no longer available. Refresh the collection and try again."
        );
      }
      if (product.stock < item.quantity) {
        throw createServiceError(
          400,
          "INSUFFICIENT_STOCK",
          `${product.name} has only ${product.stock} available. Please adjust your bag.`
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

    await tx.customer.update({
      where: { id: customer.id },
      data: { phone, address: deliveryAddress },
    });

    const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const orderNumber = `VEL-${datePart}-${randomBytes(8).toString("hex").toUpperCase()}`;

    return tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        source: "ONLINE",
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: "COD",
        deliveryAddress,
        total,
        items: { create: orderLines },
      },
      include: { items: true },
    });
  });
}
