import express from "express";

import healthRoutes from "./routes/health.routes.js";

const app = express();

// Middleware para JSON.
// Más adelante añadiremos el middleware para PDF.
app.use(express.json());

// Health Check
app.use("/api/v1/health", healthRoutes);

export default app;