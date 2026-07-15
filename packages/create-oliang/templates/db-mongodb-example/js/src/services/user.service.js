import mongoose from "mongoose";
import User from "../models/user.model.js";
import { NotFoundException } from "../utils/app-error.js";

export const listUsersService = () => User.find().sort({ createdAt: -1 });

export const getUserService = async (id) => {
  const user = mongoose.isValidObjectId(id) ? await User.findById(id) : null;
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const createUserService = (input) => User.create(input);

export const updateUserService = async (id, input) => {
  const user = mongoose.isValidObjectId(id)
    ? await User.findByIdAndUpdate(id, input, { new: true })
    : null;
  if (!user) throw new NotFoundException(`User ${id} not found`);
  return user;
};

export const deleteUserService = async (id) => {
  const user = mongoose.isValidObjectId(id)
    ? await User.findByIdAndDelete(id)
    : null;
  if (!user) throw new NotFoundException(`User ${id} not found`);
};
