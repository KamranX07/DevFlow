import api from "./axios";

export interface TaskUser {
    id: number;
    username: string;
    profilePictureUrl: string | null;
}

export interface TaskAssignee {
    id: number;
    taskId: number;
    userId: number;
    assignedById: number;
    assignedAt: string;
    user: TaskUser;
}

export interface Task {
    id: number;
    projectId: number;
    createdById: number;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: TaskUser;
    assignees: TaskAssignee[];
}

interface TaskResponse {
    success: boolean;
    count: number;
    tasks: Task[];
}

export async function getProjectTasks(projectId: number): Promise<Task[]> {
    const response = await api.get<TaskResponse>(`/projects/${projectId}/tasks`);

    return response.data.tasks;
}

export async function getTaskById(projectId: number, taskId: number): Promise<Task> {
    const response = await api.get<{ success: boolean; task: Task }>(
        `/projects/${projectId}/tasks/${taskId}`
    );

    return response.data.task;
}