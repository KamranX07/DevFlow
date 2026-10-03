import { Router } from "express";
import { createProject, getMyProjects, getMyProjectById } from "../controllers/project.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/", createProject);
router.get("/", getMyProjects);
router.get("/:id", getMyProjectById);

export default router;