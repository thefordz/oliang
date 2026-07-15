import { HTTPSTATUS } from "../config/http.config.js";
import {
  createUserService,
  deleteUserService,
  getUserService,
  listUsersService,
  updateUserService,
} from "../services/user.service.js";
import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator.js";

// Express 5 forwards rejected promises to the error handler automatically,
// so async controllers can throw (AppError, ZodError) without try/catch.
export const listUsersController = async (_req, res) => {
  const users = listUsersService();

  return res.status(HTTPSTATUS.OK).json({
    message: "Users fetched successfully",
    users,
  });
};

export const getUserController = async (req, res) => {
  const user = getUserService(req.params.id);

  return res.status(HTTPSTATUS.OK).json({
    message: "User fetched successfully",
    user,
  });
};

export const createUserController = async (req, res) => {
  const body = createUserSchema.parse(req.body);

  const user = createUserService(body);

  return res.status(HTTPSTATUS.CREATED).json({
    message: "User created successfully",
    user,
  });
};

export const updateUserController = async (req, res) => {
  const body = updateUserSchema.parse(req.body);

  const user = updateUserService(req.params.id, body);

  return res.status(HTTPSTATUS.OK).json({
    message: "User updated successfully",
    user,
  });
};

export const deleteUserController = async (req, res) => {
  deleteUserService(req.params.id);

  return res.status(HTTPSTATUS.OK).json({
    message: "User deleted successfully",
  });
};
