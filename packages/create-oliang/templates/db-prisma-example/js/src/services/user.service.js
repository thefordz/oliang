import { prisma } from "../lib/prisma.js";
import { NotFoundException } from "../utils/app-error.js";

export const listUsersService = () =>
  prisma.user.findMany({ orderBy: { createdAt: "desc" } });

export const getUserService = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const createUserService = (input) =>
  prisma.user.create({ data: input });

export const updateUserService = async (id, input) => {
  await getUserService(id);
  return prisma.user.update({ where: { id }, data: input });
};

export const deleteUserService = async (id) => {
  await getUserService(id);
  await prisma.user.delete({ where: { id } });
};
