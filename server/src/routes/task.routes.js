import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { requireProjectAdmin, requireProjectMember } from "../middleware/project.middleware.js";
import {
  createTask,
  getProjectTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  updateTaskAssignees,
  deleteTask,
} from "../controllers/task.controller.js";

const router = Router();

router.use(protect);

// Every route requires project membership.
router.use("/projects/:projectId/tasks", requireProjectMember);

router.post("/projects/:projectId/tasks", requireProjectAdmin, createTask);
router.get("/projects/:projectId/tasks", getProjectTasks);
router.get("/projects/:projectId/tasks/:taskId", getTaskById);
router.patch("/projects/:projectId/tasks/:taskId", requireProjectAdmin, updateTask);
router.patch("/projects/:projectId/tasks/:taskId/status", updateTaskStatus);

router.put("/projects/:projectId/tasks/:taskId/assignees", requireProjectAdmin, updateTaskAssignees);

router.delete("/projects/:projectId/tasks/:taskId", requireProjectAdmin, deleteTask);

export default router;