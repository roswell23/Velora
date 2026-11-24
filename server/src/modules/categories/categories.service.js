import prisma from '../../utils/prisma.js';

/** @returns {Promise<import('@prisma/client').Category[]>} */
export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * @param {{ name: string; description?: string }} data
 */
export async function createCategory(data) {
  return prisma.category.create({ data });
}

/**
 * @param {string} id
 * @param {{ name?: string; description?: string }} data
 */
export async function updateCategory(id, data) {
  return prisma.category.update({ where: { id }, data });
}
