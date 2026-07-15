import { getEnv } from "../utils/get-env.js";

export const Env = {
  NODE_ENV: getEnv("NODE_ENV", "development"),
  PORT: getEnv("PORT", "3000"),
  BASE_URL: getEnv("BASE_URL", "http://localhost:3000"),
  FRONTEND_ORIGIN: getEnv("FRONTEND_ORIGIN", "http://localhost:5173"),
  DB_URL: getEnv("DB_URL"),
};
