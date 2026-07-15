import mongoose from "mongoose";
import User from "../models/user.model.js";
import { NotFoundException } from "../utils/app-error.js";
import {
  CreateUserInput,
  UpdateUserInput,
} from "../validators/user.validator.js";

export const listUsersService = () => User.find().sort({ createdAt: -1 });

export const getUserService = async (id: string) => {
  const user = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const createUserService = (input: CreateUserInput) =>
  User.create(input);

export const updateUserService = async (
  id: string,
  input: UpdateUserInput,
) => {
  const user = mongoose.isValidObjectId(id)
    ? await User.findByIdAndUpdate(id, input, { new: true })
    : null;
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const deleteUserService = async (id: string) => {
  const user = mongoose.isValidObjectId(id)
    ? await User.findByIdAndDelete(id)
    : null;
  if (!user) throw new NotFoundException(`User ${id} not found`);
};
