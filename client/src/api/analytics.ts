import api from "./axios";

export interface ProjectOverview {
    projectId: number;
    overview: {
        totalTasks: number;
        completedTasks: number;
        overdueTasks: number;
        completionPercentage: number;
    };
    statusBreakdown: {
        TODO: number;
        IN_PROGRESS: number;
        REVIEW: number;
        DONE: number;
    };
}

export async function getProjectOverview(
    projectId: number
): Promise<ProjectOverview> {
    const response = await api.get<ProjectOverview>(
        `/projects/${projectId}/analytics/overview`
    );

    return response.data;
}