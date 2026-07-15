import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Env } from "./config/env.config.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import healthRoutes from "./routes/health.route.js";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [Env.FRONTEND_ORIGIN],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use("/health", healthRoutes);

app.use(errorHandler);

app.listen(Env.PORT, async () => {
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
