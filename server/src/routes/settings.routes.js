import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMySettings,
  updateMySettings,
  updateMyNotificationSettings,
} from "../controllers/settings.controller.js";

const router = Router();

router.use(protect);

router.get("/me/settings", getMySettings);
router.patch("/me/settings", updateMySettings);
router.patch("/me/settings/notifications", updateMyNotificationSettings);

export default router;
