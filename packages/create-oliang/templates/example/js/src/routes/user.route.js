import { Router } from "express";
import {
  createUserController,
  deleteUserController,
  getUserController,
  listUsersController,
  updateUserController,
} from "../controllers/user.controller.js";

const userRoutes = Router()
  .get("/", listUsersController)
  .post("/", createUserController)
  .get("/:id", getUserController)
  .put("/:id", updateUserController)
  .delete("/:id", deleteUserController);

export default userRoutes;
