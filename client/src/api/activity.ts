import api from "./axios";

export interface ProjectActivity {
    id: number;
    projectId: number;
    taskId: number;
    userId: number;
    action: string;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    user: {
        id: number;
        username: string;
        profilePictureUrl: string | null;
    };
    task: {
        id: number;
        title: string;
    } | null;
}

interface ActivityResponse {
    projectId: number;
    activities: ProjectActivity[];
    nextCursor: string | null;
}

export async function getProjectActivity(
    projectId: number
): Promise<ProjectActivity[]> {
    const response = await api.get<ActivityResponse>(
        `/projects/${projectId}/analytics/activity`,
        { params: { limit: 5 } }
    );

    return response.data.activities;
}