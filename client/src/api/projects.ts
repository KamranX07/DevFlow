import api from "./axios";

export interface ProjectMember {
    id: number;
    role: "ADMIN" | "MEMBER" | "VIEWER";
    joinedAt: string;
    user: {
        id: number;
        username: string;
        profilePictureUrl: string | null;
    };
}

export interface Project {
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    owner: {
        id: number;
        username: string;
        profilePictureUrl: string | null;
    };
    members: ProjectMember[];
}

interface ProjectsResponse {
    success: boolean;
    projects: Project[];
}
interface ProjectResponse {
    success: boolean;
    project: Project;
}

export async function getMyProjects(): Promise<Project[]> {
    const response = await api.get<ProjectsResponse>("/projects");

    return response.data.projects;
}

export async function getProjectById(
    projectId: number
): Promise<Project> {
    const response = await api.get<ProjectResponse>(
        `/projects/${projectId}`
    );

    return response.data.project;
}