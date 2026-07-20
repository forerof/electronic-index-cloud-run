import { Router } from "express";

import { validateApiKey } from "../middleware/api-key.middleware.js";
import { getPdfInfo } from "../services/pdf.service.js";

const router = Router();

router.post("/info", validateApiKey, async (req, res, next) => {
  try {
    const pdfInfo = await getPdfInfo(req.body);

    res.status(200).json({
      success: true,
      data: pdfInfo,
    });
  } catch (error) {
    next(error);
  }
});

export default router;