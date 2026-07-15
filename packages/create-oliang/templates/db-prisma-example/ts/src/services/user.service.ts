import { prisma } from "../lib/prisma.js";
import { NotFoundException } from "../utils/app-error.js";
import {
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user.validator.js";

export const listUsersService = () =>
  prisma.user.findMany({ orderBy: { createdAt: "desc" } });

export const getUserService = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const createUserService = (input: CreateUserInput) =>
  prisma.user.create({ data: input });

export const updateUserService = async (
  id: string,
  input: UpdateUserInput,
) => {
  await getUserService(id);
  return prisma.user.update({ where: { id }, data: input });
};

export const deleteUserService = async (id: string) => {
  await getUserService(id);
  await prisma.user.delete({ where: { id } });
};
