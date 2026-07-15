import { Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config.js";

export const checkHealthController = async (_req: Request, res: Response) => {
  res.status(HTTPSTATUS.OK).json({
    message: "server is healthy",
    status: "ok",
  });
};
