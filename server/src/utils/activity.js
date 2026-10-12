export const recordActivity = async (
    tx,
    {
        projectId,
        taskId = null,
        userId,
        action,
        metadata = null,
    }
) => {
    return tx.activity.create({
        data: {
            projectId,
            taskId,
            userId,
            action,
            ...(metadata !== null ? { metadata } : {}),
        },
    });
};