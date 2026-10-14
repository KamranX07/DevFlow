import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.get("/me", protect, getMe);

export default router;