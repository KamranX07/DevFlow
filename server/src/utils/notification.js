import prisma from "../config/db.js";

const preferenceByType = {
    TASK_ASSIGNED: "taskNotifications",
    TASK_UNASSIGNED: "taskNotifications",
    TASK_STATUS_CHANGED: "taskNotifications",
    COMMENT_ADDED: "commentNotifications",
};

export const createNotification = async (
    tx,
    {
        userId,
        type,
        message,
        projectId = null,
        taskId = null,
        invitationId = null,
    }
) => {
    const preferenceField = preferenceByType[type];

    if (!preferenceField) {
        throw new Error(`Unsupported notification type: ${type}`);
    }

    if (preferenceField) {
        const settings = await tx.userSettings.findUnique({
            where: { userId },
            select: { [preferenceField]: true },
        });

        if (settings &&  settings[preferenceField] === false) {
            return null;
        }
    }

    return tx.notification.create({
        data: {
            userId,
            type,
            message,
            projectId,
            taskId,
            invitationId,
        },
    });
};

export const withNotificationTransaction = (callback) =>
    prisma.$transaction(callback);