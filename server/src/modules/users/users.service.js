import prisma from "../../utils/prisma.js";
import { hashPassword } from "../../utils/password.js";

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
};

export async function listUsers({ search, limit, skip }) {
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
        role: { not: "CUSTOMER" },
      }
    : { role: { not: "CUSTOMER" } };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total };
}

export async function createUser({ name, email, password, role }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("An account with that email already exists.");
    err.statusCode = 409;
    err.code = "EMAIL_EXISTS";
    throw err;
  }
  const passwordHash = await hashPassword(password);
  return prisma.user.create({
    data: { name, email, passwordHash, role },
    select: USER_SELECT,
  });
}

export async function updateUser(id, data) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error("User not found.");
    err.statusCode = 404;
    err.code = "NOT_FOUND";
    throw err;
  }
  return prisma.user.update({ where: { id }, data, select: USER_SELECT });
}
