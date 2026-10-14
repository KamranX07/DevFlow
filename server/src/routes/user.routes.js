import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  deleteMyAvatar,
} from "../controllers/user.controller.js";
import { uploadAvatar } from "../middleware/avatar-upload.middleware.js";
import { handleUploadError } from "../middleware/upload-error.middleware.js";

const router = Router();

router.use(protect);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);

router.post("/me/avatar", handleUploadError, uploadAvatar, uploadMyAvatar);
router.delete("/me/avatar", deleteMyAvatar);

export default router;