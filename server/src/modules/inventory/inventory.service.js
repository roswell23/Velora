import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { paginationMeta, parsePagination } from "../../utils/response.js";

function createServiceError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

export async function recordStockIn(staffUserId, { productId, quantity, unitCost, supplierName, notes }) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id: productId } });
    if (!existing) {
      throw createServiceError(404, "NOT_FOUND", "Product not found.");
    }

    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
      include: { category: { select: { id: true, name: true } } },
    });

    const reasonParts = [];
    if (supplierName) reasonParts.push(`Supplier: ${supplierName}`);
    if (notes) reasonParts.push(notes);

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        type: "STOCK_IN",
        quantity,
        unitCost: new Prisma.Decimal(unitCost.toString()),
        reason: reasonParts.join(" · ") || "Warehouse stock-in",
        performedById: staffUserId,
      },
    });

    return { product: updatedProduct, movement };
  });
}

export async function listMovements(query) {
  const { productId, type } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = {};
  if (productId) where.productId = productId;
  if (type) where.type = type;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        performedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}
