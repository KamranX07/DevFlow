import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireProjectAdmin } from "../middleware/project.middleware.js";
import { createInvitation } from "../controllers/invitation.controller.js";

const router = Router();

router.use(protect);

router.post(
    "/projects/:projectId/invitations",
    requireProjectAdmin,
    createInvitation
);

export default router;