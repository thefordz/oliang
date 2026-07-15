import mongoose from "mongoose";
import { Env } from "./env.config.js";

export const connectDBService = async () => {
  try {
    await mongoose.connect(Env.DB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(
      "Failed to connect to MongoDB — is it running? Check DB_URL in .env",
    );
    console.error(error);
    process.exit(1);
  }
};
