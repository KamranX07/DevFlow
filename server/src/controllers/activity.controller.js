
import prisma from "../config/db.js";

export const getProjectActivity = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
    }

    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const cursor = req.query.cursor
      ? Number(req.query.cursor)
      : undefined;

    if (
      cursor !== undefined &&
      (!Number.isSafeInteger(cursor) || cursor <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity cursor",
      });
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
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = activities.length > limit;
    const items = hasMore ? activities.slice(0, limit) : activities;

    return res.status(200).json({
      success: true,
      activities: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    console.error("Get project activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve project activity",
    });
  }
};
