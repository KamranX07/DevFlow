
import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireProjectMember } from "../middleware/project.middleware.js";
import { uploadSingleAttachment } from "../middleware/upload.middleware.js";
import {
  uploadAttachment,
  getTaskAttachments,
  deleteAttachment,
} from "../controllers/attachment.controller.js";

const router = Router();

router.use(protect);

router.post(
  "/projects/:projectId/tasks/:taskId/attachments",
  requireProjectMember,
  uploadSingleAttachment,
  uploadAttachment
);

router.get(
  "/projects/:projectId/tasks/:taskId/attachments",
  requireProjectMember,
  getTaskAttachments
);

router.delete(
  "/projects/:projectId/tasks/:taskId/attachments/:attachmentId",
  requireProjectMember,
  deleteAttachment
);

export default router;
