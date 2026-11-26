import prisma from "../../utils/prisma.js";
import { paginationMeta, parsePagination } from "../../utils/response.js";

export async function listCustomers(query) {
  const { search } = query;
  const { page, limit, skip } = parsePagination(query);

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: { select: { orders: true } },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

export async function createCustomer(data) {
  return prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
    },
    include: {
      _count: { select: { orders: true } },
    },
  });
}

export async function updateCustomer(id, data) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error("Customer not found.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }

  return prisma.customer.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.address !== undefined && { address: data.address || null }),
    },
    include: {
      _count: { select: { orders: true } },
    },
  });
}
