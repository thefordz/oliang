import { Router } from "express";
import { checkHealthController } from "../controllers/health.controller.js";

const healthRoutes = Router().get("/", checkHealthController);

export default healthRoutes;
