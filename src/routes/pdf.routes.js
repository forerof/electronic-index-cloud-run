import { Router } from "express";

const router = Router();

router.post("/info", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PDF endpoint available.",
  });
});

export default router;