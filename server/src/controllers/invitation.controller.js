import { success } from "zod";
import prisma from "../config/db.js";
import { createInvitationSchema } from "../validators/invitation.validator.js";

export const createInvitation = async (req, res) => {
    try {
        const projectId = Number(req.params.projectId)

        const result = createInvitationSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { identifier, role } = result.data;

        const invitedUser = await prisma.user.findFirst({
            where: {
                OR: [
                    {
                        username: identifier,
                    },
                    {
                        email: identifier,
                    },
                ],
            },
        });

        if(!invitedUser) {
            return res.status(404).json({
                success: false,
                message: "No DevFlow user found with that username or email",
            });
        }

        if(invitedUser.id === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot invite yourself",
            });
        }

        const existingMembership = await prisma.projectMember.findUnique({
            where: {
                projectId_userId: {
                    projectId,
                    userId: invitedUser.id,
                },
            },
        });

        if(existingMembership) {
            return res.status(400).json({
                success: false,
                message: "User is already a member of this project",
            });
        }

        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                projectId,
                invitedUserId: invitedUser.id,
                status: "PENDING",
            },
        });

        if (existingInvitation) {
            return res.status(409).json({
                success: false,
                message: "Invitation already pending",
            });
        }

        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        const invitation = await prisma.invitation.create({
            data: {
                projectId,
                invitedUserId: invitedUser.id,
                invitedById: req.user.id,
                role,
                expiresAt,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            invitation,
        });
    } catch (error) {
        console.error("Create invitation error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};