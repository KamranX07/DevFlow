import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireProjectAdmin } from "../middleware/project.middleware.js";
import {
    createInvitation, 
    getMyInvitations, 
    getProjectInvitations, 
    acceptInvitation, 
    rejectInvitation, 
} from "../controllers/invitation.controller.js";

const router = Router();

router.use(protect);

router.get("/invitations", getMyInvitations);

router.post("/invitations/:id/accept", acceptInvitation);

router.post("/invitations/:id/reject", rejectInvitation);

router.get(
    "/projects/:projectId/invitations",
    requireProjectAdmin,
    getProjectInvitations
);

router.post(
    "/projects/:projectId/invitations",
    requireProjectAdmin,
    createInvitation
);

export default router;