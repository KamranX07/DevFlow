import { success } from "zod";
import prisma from "../config/db.js";
import { createProjectSchema } from "../validators/project.validator.js";

export const createProject = async (req, res) => {
    try {
        const result = createProjectSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { name, description } = result.data;

        const userId = req.user.id;

        const project = await prisma.$transaction(async (tx) => {
            const newProject = await tx.project.create({
                data: {
                    name,
                    description: description || null,
                    ownerId: userId,
                },
            });

            await tx.projectMember.create({
                data: {
                    projectId: newProject.id,
                    userId,
                    role: "ADMIN",
                },
            });

            return newProject;
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project,
        });
    } catch (error) {
        console.error("Create project error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getMyProjects = async (req, res) => {
    try {
        const userId = req.user.id;

        const projects = await prisma.project.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        role: true,
                        joinedAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePictureUrl: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return res.status(200).json({
            success: true,
            projects,
        });
    } catch (error) {
        console.error("Get projects error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const getMyProjectById = async (req, res) => {
    try {
        const projectId = Number(req.params.id);

        if(!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const userId = req.user.id;

        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        username: true,
                        profilePictureUrl: true,
                    },
                },
                members: {
                    select: {
                        id: true,
                        role: true,
                        joinedAt: true,
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profilePictureUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if(!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        return res.status(200).json({
            success: true,
            project,
        });
    } catch (error) {
        console.error("Get project error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};