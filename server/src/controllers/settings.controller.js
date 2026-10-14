import prisma from "../config/db.js";
import {
  updateSettingsSchema,
  updateNotificationSettingsSchema,
} from "../validators/settings.validator.js";

export const getMySettings = async (req, res, next) => {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
      select: {
        theme: true,
        emailNotifications: true,
        taskNotifications: true,
        commentNotifications: true,
        updatedAt: true,
      },
    });

    if (!settings) {
      return res.status(404).json({
        message: "User settings not found.",
      });
    }

    return res.status(200).json({ settings });
  } catch (error) {
    next(error);
  }
};

export const updateMySettings = async (req, res, next) => {
  try {
    const validation = updateSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid settings.",
        errors: validation.error.issues,
      });
    }

    const settings = await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: validation.data,
      select: {
        theme: true,
        emailNotifications: true,
        taskNotifications: true,
        commentNotifications: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Settings updated successfully.",
      settings,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "User settings not found.",
      });
    }

    next(error);
  }
};

export const updateMyNotificationSettings = async (
  req,
  res,
  next
) => {
  try {
    const validation =
      updateNotificationSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid notification settings.",
        errors: validation.error.issues,
      });
    }

    const settings = await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: validation.data,
      select: {
        emailNotifications: true,
        taskNotifications: true,
        commentNotifications: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "Notification settings updated successfully.",
      settings,
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "User settings not found.",
      });
    }

    next(error);
  }
};
