import { Router } from "express";

import { validateApiKey } from "../middleware/api-key.middleware.js";
import { getPdfInfo } from "../services/pdf.service.js";

const router = Router();

router.post("/info", validateApiKey, async (req, res) => {
  try {
    const pdfInfo = await getPdfInfo(req.body);

    res.status(200).json({
      success: true,
      data: pdfInfo,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PDF",
        message: "The file is not a valid PDF.",
      },
    });
  }
});

export default router;