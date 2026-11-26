import prisma from '../../utils/prisma.js';
import { parsePagination, paginationMeta } from '../../utils/response.js';

/**
 * List products with optional search, filter, sort, pagination.
 * @param {object} query
 * @param {boolean} [publicOnly] - if true, only return isActive=true products
 */
export async function listProducts(query, publicOnly = false) {
  const { search, categoryId, minPrice, maxPrice, sort, isActive, page, limit } = query;
  const { skip, limit: take } = parsePagination({ page, limit });

  const where = {};

  if (publicOnly) {
    where.isActive = true;
  } else if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.unitPrice = {};
    if (minPrice !== undefined) where.unitPrice.gte = minPrice;
    if (maxPrice !== undefined) where.unitPrice.lte = maxPrice;
  }

  let orderBy = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { unitPrice: 'asc' };
  else if (sort === 'price_desc') orderBy = { unitPrice: 'desc' };
  else if (sort === 'newest') orderBy = { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: paginationMeta(page, limit, total) };
}

/**
 * @param {string} id
 * @param {boolean} [publicOnly]
 */
export async function getProductById(id, publicOnly = false) {
  const where = { id };
  if (publicOnly) where.isActive = true;
  return prisma.product.findFirst({
    where,
    include: { category: { select: { id: true, name: true } } },
  });
}

/**
 * @param {object} data
 */
export async function createProduct(data) {
  const { unitPrice, stock, reorderLevel, ...rest } = data;
  return prisma.product.create({
    data: {
      ...rest,
      unitPrice,
      stock,
      reorderLevel,
    },
    include: { category: { select: { id: true, name: true } } },
  });
}

/**
 * @param {string} id
 * @param {object} data
 */
export async function updateProduct(id, data) {
  return prisma.product.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });
}
