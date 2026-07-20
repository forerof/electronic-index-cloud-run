import { Router } from "express";

import { getPdfInfo } from "../services/pdf.service.js";

const router = Router();

router.post("/info", async (req, res) => {
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