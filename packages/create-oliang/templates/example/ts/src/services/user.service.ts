import { randomUUID } from "node:crypto";
import { NotFoundException } from "../utils/app-error.js";
import { User } from "../types/user.type.js";
import {
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user.validator.js";

// In-memory store — replace with a real database layer when ready.
const users: User[] = [];

export const listUsersService = (): User[] => users;

export const getUserService = (id: string): User => {
  const user = users.find((item) => item.id === id);
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const createUserService = (input: CreateUserInput): User => {
  const user: User = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
};

export const updateUserService = (
  id: string,
  input: UpdateUserInput,
): User => {
  const user = getUserService(id);
  Object.assign(user, input);
  return user;
};

export const deleteUserService = (id: string): void => {
  const index = users.findIndex((item) => item.id === id);
  if (index === -1) throw new NotFoundException(`User ${id} not found`);
  users.splice(index, 1);
};
