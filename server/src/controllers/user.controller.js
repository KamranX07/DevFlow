import prisma from "../config/db.js";
import { updateProfileSchema } from "../validators/user.validator.js";
import cloudinary from "../config/cloudinary.js";
import { Readable } from "node:stream";

const publicUserSelect = {
    id: true,
    username: true,
    email: true,
    profilePictureUrl: true,
    createdAt: true,
    updatedAt: true,
};

export const getMyProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: publicUserSelect,
        });

        if(!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

export const updateMyProfile = async (req, res, next) => {
    try {
        const validation = updateProfileSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid profile data.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        const { username } = validation.data;

        if (username !== undefined) {
            const existingUser = await prisma.user.findUnique({
                where: { username },
                select: { id: true },
            });

            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(409).json({
                    message: "That username is already taken.",
                });
            }
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: validation.data,
            select: publicUserSelect,
        });

        return res.status(200).json({
            message: "Profile updated successfully.",
            user,
        });
    } catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({
                message: "That username is already taken.",
            });
        }

        next(error);
    }
};


const uploadAvatarToCloudinary = (file, userId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "devflow/avatars",
        public_id: `user_${userId}_${Date.now()}`,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });

export const uploadMyAvatar = async (req, res, next) => {
  let uploadedAsset;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an avatar image.",
      });
    }

    // Verify that the uploaded buffer is actually a supported image.
    const { fileTypeFromBuffer } = await import("file-type");
    const detected = await fileTypeFromBuffer(req.file.buffer);

    const allowedDetectedTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);

    if (!detected || !allowedDetectedTypes.has(detected.mime)) {
      return res.status(400).json({
        message: "The uploaded file is not a supported image.",
      });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profilePicturePublicId: true },
    });

    if(!currentUser) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    uploadedAsset = await uploadAvatarToCloudinary(
      req.file,
      req.user.id
    );

    // Save the new avatar before attempting to remove the old one.
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        profilePictureUrl: uploadedAsset.secure_url,
        profilePicturePublicId: uploadedAsset.public_id,
      },
      select: publicUserSelect,
    });

    // Best-effort cleanup: a failed cleanup must not undo the new avatar.
    const oldPublicId = currentUser.profilePicturePublicId;

    if (oldPublicId && oldPublicId !== uploadedAsset.public_id) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("Old avatar cleanup failed:", cleanupError.message);
      }
    }

    return res.status(200).json({
      message: "Profile picture updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    // If saving the new avatar failed, try to remove the new cloud asset.
    if (uploadedAsset?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedAsset.public_id, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("New avatar cleanup failed:", cleanupError.message);
      }
    }

    next(error);
  }
};

export const deleteMyAvatar = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        profilePicturePublicId: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.profilePicturePublicId) {
      return res.status(404).json({
        message: "You do not have a profile picture.",
      });
    }

    // Clear the database reference first.
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        profilePictureUrl: null,
        profilePicturePublicId: null,
      },
      select: publicUserSelect,
    });

    try {
      await cloudinary.uploader.destroy(user.profilePicturePublicId, {
        resource_type: "image",
        invalidate: true,
      });
    } catch (cleanupError) {
      // The database is already cleared; log this for later cleanup.
      console.error("Avatar deletion from Cloudinary failed:", cleanupError.message);
    }

    return res.status(200).json({
      message: "Profile picture removed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
