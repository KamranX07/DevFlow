import prisma from "../config/db.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "../validators/comment.validator.js";
import { recordActivity } from "../utils/activity.js";
import { createNotification } from "../utils/notification.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

const commentAuthor = {
  select: {
    id: true,
    username: true,
    profilePictureUrl: true,
  },
};

async function findTask(projectId, taskId) {
  return prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
    },
    select: { id: true },
  });
}

// CREATE COMMENT
export const createComment = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    const parsed = createCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const task = await findTask(projectId, taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in this project",
      });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const createdComment = await tx.comment.create({
        data: {
          taskId,
          userId: req.user.id,
          message: parsed.data.message,
        },
        include: {
          user: commentAuthor,
        },
      });

      const taskDetails = await tx.task.findUnique({
        where: { id: taskId },
        select: {
          createdById: true,
          title: true,
          assignees: {
            select: {
              userId: true,
            },            
          },
        },
      });

      if(!taskDetails) {
        throw new Error("TASK_NOT_FOUND");
      }

      const recipientIds = new Set([
        taskDetails.createdById,
        ...taskDetails.assignees.map((assignee) => assignee.userId),
      ]);

      for (const userId of recipientIds) {
        if (userId === req.user.id) continue;

        await createNotification(tx, {
          userId,
          type: "COMMENT_ADDED",
          message: `${req.user.username} commented on task "${taskDetails.title}".`,
          projectId,
          taskId,
        });
      }

      await recordActivity(tx, {
        projectId,
        taskId,
        userId: req.user.id,
        action: "COMMENT_CREATED",
        metadata: {
          commentId: createdComment.id,
        },
      });

      return createdComment;
    })
    
    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not add comment",
    });
  }
};

// LIST COMMENTS
export const getTaskComments = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project or task ID",
      });
    }

    const task = await findTask(projectId, taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found in this project",
      });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: commentAuthor,
      },
      orderBy: [
        { createdAt: "asc" },
        { id: "asc" },
      ],
    });

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve comments",
    });
  }
};

// EDIT COMMENT
export const updateComment = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);
    const commentId = parseId(req.params.commentId);

    if (!projectId || !taskId || !commentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project, task, or comment ID",
      });
    }

    const parsed = updateCommentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        taskId,
        task: { projectId },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isAuthor = comment.userId === req.user.id;
    const isAdmin = req.projectMembership?.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedComment = await tx.comment.update({
        where: { id: commentId },
        data: { message: parsed.data.message },
        include: {
          user: commentAuthor,
        },
      });

      await recordActivity(tx, {
        projectId,
        taskId,
        userId: req.user.id,
        action: "COMMENT_UPDATED",
        metadata: {
          commentId,
        },
      });

      return updatedComment;
    })
    
    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updated,
    });
  } catch (error) {
    console.error("Update comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update comment",
    });
  }
};

// DELETE COMMENT
export const deleteComment = async (req, res) => {
  try {
    const projectId = parseId(req.params.projectId);
    const taskId = parseId(req.params.taskId);
    const commentId = parseId(req.params.commentId);

    if (!projectId || !taskId || !commentId) {
      return res.status(400).json({
        success: false,
        message: "Invalid project, task, or comment ID",
      });
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        taskId,
        task: { projectId },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const isAuthor = comment.userId === req.user.id;
    const isAdmin = req.projectMembership?.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    await prisma.$transaction(async (tx) => {
      await recordActivity(tx, {
        projectId,
        taskId,
        userId: req.user.id,
        action: "COMMENT_DELETED",
        metadata: {
          commentId,
        },
      });

      await tx.comment.delete({
        where: { id: commentId },
      });
    });    

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete comment",
    });
  }
};
