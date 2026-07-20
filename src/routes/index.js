import { Router } from "express";

import healthRoutes from "./health.routes.js";
import pdfRoutes from "./pdf.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/pdf", pdfRoutes);

export default router;