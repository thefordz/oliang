import { HTTPSTATUS } from "../config/http.config.js";

export const checkHealthController = async (_req, res) => {
  res.status(HTTPSTATUS.OK).json({
    message: "server is healthy",
    status: "ok",
  });
};
