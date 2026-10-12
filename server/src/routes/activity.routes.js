import { Router } from "express";

import { protect } from "../middleware/auth.middleware.js";
import { requireProjectMember } from "../middleware/project.middleware.js";
import { getProjectActivity } from "../controllers/activity.controller.js";

const router = Router();

router.use(protect);

router.get(
  "/projects/:projectId/activity",
  requireProjectMember,
  getProjectActivity
);

export default router;