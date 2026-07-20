import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 8080,
  apiKey: process.env.API_KEY || "",
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 20 * 1024 * 1024,
};