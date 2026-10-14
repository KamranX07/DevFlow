import prisma from "../config/db.js";

const parseProjectId = (value) => {
  const id = Number(value);

  return Number.isSafeInteger(id) && id > 0
    ? id
    : null;
};

export const getProjectAnalyticsOverview = async (
  req,
  res,
  next
) => {
  try {
    const projectId = parseProjectId(req.params.projectId);

    if (!projectId) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    // Authorization is handled by requireProjectMember
    // in the route middleware.
    const now = new Date();

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: { projectId },
      }),

      prisma.task.count({
        where: {
          projectId,
          status: "DONE",
        },
      }),

      prisma.task.count({
        where: {
          projectId,
          deadline: { lt: now },
          status: { not: "DONE" },
        },
      }),

      prisma.task.count({
        where: {
          projectId,
          status: "IN_PROGRESS",
        },
      }),

      prisma.task.count({
        where: {
          projectId,
          status: "REVIEW",
        },
      }),

      prisma.task.count({
        where: {
          projectId,
          status: "TODO",
        },
      }),
    ]);

    const completionPercentage =
      totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return res.status(200).json({
      projectId,
      overview: {
        totalTasks,
        completedTasks,
        overdueTasks,
        completionPercentage,
      },
      statusBreakdown: {
        TODO: todoTasks,
        IN_PROGRESS: inProgressTasks,
        REVIEW: reviewTasks,
        DONE: completedTasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectPriorityAnalytics = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if(!Number.isSafeInteger(projectId)) {
      return res.status(400).json({
        message: "Invalid Project ID."
      });
    }

    const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    const grouped = await prisma.task.groupBy({
      by: ["priority"],
      where: { projectId },
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      priorities.map((priority) => [priority, 0])
    );

    for (const item of grouped) {
      counts[item.priority] = item._count._all;
    }

    return res.status(200).json({
      projectId,
      priorityBreakdown: counts,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectMemberAnalytics = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      select: {
        role: true,
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
            taskAssignees: {
              where: {
                task: { projectId },
              },
              select: {
                task: {
                  select: { status: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    const memberStats = members.map((membership) => {
      const assignments = membership.user.taskAssignees;

      const assignedTasks = assignments.length;

      const completedAssignments = assignments.filter(
        (assignment) => assignment.task.status === "DONE"
      ).length;

      const activeAssignments =
        assignedTasks - completedAssignments;

      const completionRate =
        assignedTasks === 0
          ? 0
          : Math.round(
              (completedAssignments / assignedTasks) * 100
            );

      return {
        userId: membership.user.id,
        username: membership.user.username,
        profilePictureUrl: membership.user.profilePictureUrl,
        role: membership.role,
        assignedTasks,
        completedAssignments,
        activeAssignments,
        completionRate,
      };
    });

    return res.status(200).json({
      projectId,
      members: memberStats,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectActivityAnalytics = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        message: "Invalid project ID.",
      });
    }

    const rawLimit = req.query.limit;
    const limit = rawLimit === undefined ? 20 : Number(rawLimit);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "Limit must be an integer between 1 and 100.",
      });
    }

    const rawCursor = req.query.cursor;
    const cursor = rawCursor === undefined ? null : Number(rawCursor);

    if (
      cursor !== null &&
      (!Number.isSafeInteger(cursor) || cursor <= 0)
    ) {
      return res.status(400).json({
        message: "Invalid cursor.",
      });
    }
   
    if (cursor !== null) {
      const cursorActivity = await prisma.activity.findFirst({
        where: {
          id: cursor,
          projectId,
        },
        select: {
          id: true,
        },
      });

      if (!cursorActivity) {
        return res.status(400).json({
          success: false,
          message: "Invalid cursor.",
        });
      }
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    const hasMore = activities.length > limit;
    const items = activities.slice(0, limit);

    return res.status(200).json({
      projectId,
      activities: items,
      nextCursor: hasMore
        ? items[items.length - 1].id
        : null,
    });
  } catch (error) {
    next(error);
  }
};
