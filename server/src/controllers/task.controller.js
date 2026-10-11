import prisma from "../config/db.js";

import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTaskAssigneesSchema,
} from "../validators/task.validator.js";

const taskDetails = {
  createdBy: {
    select: {
      id: true,
      username: true,
      profilePictureUrl: true,
    },
  },
  assignees: {
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePictureUrl: true,
        },
      },
    },
  },
};

const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const isProjectAdmin = (req) =>
  req.projectMembership?.role === "ADMIN";

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    if (!isProjectAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only project admins can create tasks",
      });
    }

    const result = createTaskSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { title, description, priority, deadline } = result.data;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority ?? "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        projectId,
        createdById: req.user.id,
      },
      include: taskDetails,
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create task",
    });
  }
};

// LIST PROJECT TASKS
export const getProjectTasks = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const { status, priority } = req.query;

    const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status filter",
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority filter",
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      include: taskDetails,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error("Get project tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve tasks",
    });
  }
};

// GET ONE TASK
export const getTaskById = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      include: {
        ...taskDetails,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve task",
    });
  }
};

// UPDATE TASK DETAILS
export const updateTask = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    if (!isProjectAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only project admins can edit task details",
      });
    }

    const result = updateTaskSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const data = { ...result.data };

    if (data.deadline !== undefined) {
      data.deadline = data.deadline ? new Date(data.deadline) : null;
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskDetails,
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update task",
    });
  }
};

// CHANGE TASK STATUS
export const updateTaskStatus = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    const role = req.projectMembership?.role;

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Admins and members can update task status",
      });
    }

    const result = updateTaskStatusSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { status: newStatus } = result.data;

    const transitions = {
      TODO: ["IN_PROGRESS"],
      IN_PROGRESS: ["REVIEW"],
      REVIEW: ["DONE"],
      DONE: [],
    };

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (task.status === newStatus) {
      return res.status(400).json({
        success: false,
        message: "Task already has this status",
      });
    }

    if (!transitions[task.status].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition task from ${task.status} to ${newStatus}`,
      });
    }

    // Only update if the status is still the one we read.
    // This prevents a stale request from overwriting a concurrent change.
    const updated = await prisma.task.updateMany({
      where: {
        id: taskId,
        projectId,
        status: task.status,
      },
      data: { status: newStatus },
    });

    if (updated.count !== 1) {
      return res.status(409).json({
        success: false,
        message: "Task status changed concurrently. Refresh and try again.",
      });
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskDetails,
    });

    return res.status(200).json({
      success: true,
      message: `Task moved to ${newStatus}`,
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task status error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update task status",
    });
  }
};

// REPLACE TASK ASSIGNEES
export const updateTaskAssignees = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    if (!isProjectAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only project admins can assign tasks",
      });
    }

    const result = updateTaskAssigneesSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const userIds = result.data.userIds;

    if (new Set(userIds).size !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate user IDs are not allowed",
      });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId },
      select: { id: true },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Every assignee must belong to this project.
    const memberships = await prisma.projectMember.findMany({
      where: {
        projectId,
        userId: { in: userIds },
      },
      select: { userId: true },
    });

    if (memberships.length !== userIds.length) {
      return res.status(400).json({
        success: false,
        message: "Every assignee must be a member of this project",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskAssignee.deleteMany({
        where: { taskId },
      });

      if (userIds.length > 0) {
        await tx.taskAssignee.createMany({
          data: userIds.map((userId) => ({
            taskId,
            userId,
            assignedById: req.user.id,
          })),
        });
      }
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: taskDetails,
    });

    return res.status(200).json({
      success: true,
      message: "Task assignees updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task assignees error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update task assignees",
    });
  }
};

// DELETE TASK
export const deleteTask = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    if (!isProjectAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Only project admins can delete tasks",
      });
    }

    const deleted = await prisma.task.deleteMany({
      where: { id: taskId, projectId },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete task",
    });
  }
};