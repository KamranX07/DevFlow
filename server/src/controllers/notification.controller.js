import prisma from "../config/db.js";

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 20, 1),
            100
        );

        const cursor = req.query.cursor ? Number(req.query.cursor) : null;

        if (cursor !== null && (!Number.isSafeInteger(cursor) || cursor <= 0)) {
            return res.status(400).json({
                message: "Invalid cursor.",
            });
        }

        if (cursor !== null) {
            const cursorNotification = await prisma.notification.findFirst({
                where: {
                    id: cursor,
                    userId,
                },
                select: {
                    id: true,
                },
            });

            if (!cursorNotification) {
                return res.status(400).json({
                    message: "Invalid cursor.",
                });
            }
        }

        const notification = await prisma.notification.findMany({
            where: { userId },
            orderBy: [
                { createdAt: "desc" },
                { id: "desc" },
            ],
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        const hasMore = notification.length > limit;
        const items = notification.slice(0, limit);

        return res.status(200).json({
            notification: items,
            nextCursor: hasMore ? items[items.length - 1].id : null,
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req, res, next) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.user.id,
                isRead: false,
            },
        });

        return res.status(200).json({ unreadCount: count });
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsRead = async (req, res, next) => {
    try {
        const notificationId = Number(req.params.id);

        if (!Number.isSafeInteger(notificationId) || notificationId <=0) {
            return res.status(400).json({
                message: "Invalid notification ID.",
            });
        }

        const result = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: req.user.id,
            },
            data: {isRead : true},
        });

        if (result.count === 0) {
            return res.status(404).json({
                message: "Notification not found.",
            });
        }

        return res.status(200).json({
            message: "Notification marked as read.",
        });
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        const result = await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        return res.status(200).json({
            message: "All notification marked as read.",
            updatedCount: result.count,
        });
    } catch (error) {
        next(error);
    }
};