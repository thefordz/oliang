import { z, ZodError } from "zod";
import { HTTPSTATUS } from "../config/http.config.js";
import { AppError, ErrorCodes } from "../utils/app-error.js";

export const errorHandler = (error, req, res, next) => {
  console.log(`Error occured: ${req.path} ${error}`);

  if (error instanceof SyntaxError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Invalid JSON format. Please check your request body.",
    });
  }

  if (error instanceof ZodError) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Validation failed",
      errorCode: ErrorCodes.ERROR_VALIDATION_ERROR,
      errors: z.flattenError(error).fieldErrors,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      errorCode: error.errorCode,
    });
  }

  return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
    message: "Internal Server Error",
    error: error?.message || "Something went wrong",
  });
};
