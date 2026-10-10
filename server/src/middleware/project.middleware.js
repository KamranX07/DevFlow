import prisma from "../config/db.js";

export const requireProjectAdmin = async (req, res, next) => {
    try {
        const projectId = Number(req.params.projectId);

        if(!Number.isInteger(projectId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid project ID",
            });
        }

        const membership = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: req.user.id,
                },
            },
        });

        if (!membership) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this project",
            });
        }

        if (membership.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Only project admins can perform this action",
            });
        }

        req.projectMembership = membership;

        next();
    } catch (error) {
        console.error("Project authorization error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};