import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireProjectMember } from "../middleware/project.middleware.js";
import {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(protect);
router.use("/projects/:projectId/tasks/:taskId/comments", requireProjectMember);
router.post("/projects/:projectId/tasks/:taskId/comments", createComment);
router.get("/projects/:projectId/tasks/:taskId/comments", getTaskComments);
router.patch("/projects/:projectId/tasks/:taskId/comments/:commentId", updateComment);
router.delete("/projects/:projectId/tasks/:taskId/comments/:commentId", deleteComment);

export default router;
