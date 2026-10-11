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

export const getMyInvitations = async (req, res) => {
  try {
    const now = new Date();

    // Mark this user's expired pending invitations as expired.
    await prisma.invitation.updateMany({
      where: {
        invitedUserId: req.user.id,
        status: "PENDING",
        expiresAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    const invitations = await prisma.invitation.findMany({
      where: {
        invitedUserId: req.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error("Get invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const getProjectInvitations = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const now = new Date();

    await prisma.invitation.updateMany({
      where: {
        projectId,
        status: "PENDING",
        expiresAt: { lte: now },
      },
      data: {
        status: "EXPIRED",
      },
    });

    const invitations = await prisma.invitation.findMany({
      where: { projectId },
      include: {
        invitedUser: {
          select: {
            id: true,
            username: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      invitations,
    });
  } catch (error) {
    console.error("Get project invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.id);

    if (!Number.isSafeInteger(invitationId) || invitationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID",
      });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findFirst({
        where: {
          id: invitationId,
          invitedUserId: req.user.id,
        },
      });

      if (!invitation) {
        return { error: "NOT_FOUND" };
      }

      if (invitation.status !== "PENDING") {
        return { error: "NOT_PENDING" };
      }

      if (invitation.expiresAt <= now) {
        await tx.invitation.update({
          where: { id: invitation.id },
          data: { status: "EXPIRED" },
        });

        return { error: "EXPIRED" };
      }

      await tx.projectMember.create({
        data: {
          projectId: invitation.projectId,
          userId: req.user.id,
          role: invitation.role,
        },
      });

      const updatedInvitation = await tx.invitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
          expiresAt: { gt: now },
        },
        data: {
          status: "ACCEPTED",
          respondedAt: now,
        },
      });

      if (updatedInvitation.count !== 1) {
        throw new Error("Invitation changed during acceptance");
      }

      return { invitation };
    });

    if (result.error === "NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    if (result.error === "NOT_PENDING") {
      return res.status(409).json({
        success: false,
        message: "Invitation is no longer pending",
      });
    }

    if (result.error === "EXPIRED") {
      return res.status(410).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not accept invitation",
    });
  }
};

export const rejectInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.id);

    if (!Number.isSafeInteger(invitationId) || invitationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid invitation ID",
      });
    }

    const now = new Date();

    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        invitedUserId: req.user.id,
      },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    if (invitation.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "Invitation is no longer pending",
      });
    }

    if (invitation.expiresAt <= now) {
      await prisma.invitation.updateMany({
        where: {
          id: invitation.id,
          status: "PENDING",
        },
        data: { status: "EXPIRED" },
      });

      return res.status(410).json({
        success: false,
        message: "Invitation has expired",
      });
    }

    const updated = await prisma.invitation.updateMany({
      where: {
        id: invitation.id,
        invitedUserId: req.user.id,
        status: "PENDING",
        expiresAt: { gt: now },
      },
      data: {
        status: "REJECTED",
        respondedAt: now,
      },
    });

    if (updated.count !== 1) {
      return res.status(409).json({
        success: false,
        message: "Invitation has already been processed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invitation rejected successfully",
    });
  } catch (error) {
    console.error("Reject invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not reject invitation",
    });
  }
};