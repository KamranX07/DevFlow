import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireProjectMember } from "../middleware/project.middleware.js";
import { 
  getProjectAnalyticsOverview, 
  getProjectPriorityAnalytics, 
  getProjectMemberAnalytics,
  getProjectActivityAnalytics 
} from "../controllers/analytics.controller.js";

const router = Router();

router.use(protect);

router.get(
  "/projects/:projectId/analytics/overview",
  requireProjectMember,
  getProjectAnalyticsOverview
);

router.get(
  "/projects/:projectId/analytics/priorities",
  requireProjectMember,
  getProjectPriorityAnalytics
);

router.get(
  "/projects/:projectId/analytics/members",
  requireProjectMember,
  getProjectMemberAnalytics
);

router.get(
  "/projects/:projectId/analytics/activity",
  requireProjectMember,
  getProjectActivityAnalytics
);

export default router;
