import { env } from "../config/env.js";

export function validateApiKey(req, res, next) {
  const apiKey = req.header("X-API-Key");

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: "MISSING_API_KEY",
        message: "API Key is required.",
      },
    });
  }

  if (apiKey !== env.apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_API_KEY",
        message: "API Key is invalid.",
      },
    });
  }

  next();
}