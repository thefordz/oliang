import { randomUUID } from "node:crypto";
import { NotFoundException } from "../utils/app-error.js";

// In-memory store — replace with a real database layer when ready.
const users = [];

export const listUsersService = () => users;

export const getUserService = (id) => {
  const user = users.find((item) => item.id === id);
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const createUserService = (input) => {
  const user = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
};

export const updateUserService = (id, input) => {
  const user = getUserService(id);
  Object.assign(user, input);
  return user;
};

export const deleteUserService = (id) => {
  const index = users.findIndex((item) => item.id === id);
  if (index === -1) throw new NotFoundException(`User ${id} not found`);
  users.splice(index, 1);
};
