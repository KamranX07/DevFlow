import cloudinary from "../config/cloudinary.js";
import { Readable } from "node:stream";
import prisma from "../config/db.js";
import { recordActivity } from "../utils/activity.js";
import { fileTypeFromBuffer } from "file-type";

const validateAttachmentContent = async (file) => {
  const detected = await fileTypeFromBuffer(file.buffer);

  const allowedDetectedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/zip",
  ]);

  // Binary formats must match their detected signature.
  if (detected && allowedDetectedTypes.has(detected.mime)) {
    if (detected.mime !== "application/zip") {
      return detected.mime === file.mimetype;
    }

    // ZIP-based office files also use ZIP signatures.
    // Their internal structure needs separate validation.
    return file.mimetype === "application/zip" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }

  // Plain text and CSV usually have no detectable binary signature.
  if (
    file.mimetype !== "text/plain" &&
    file.mimetype !== "text/csv"
  ) {
    return false;
  }

  const text = file.buffer.toString("utf8");

  // Reject binary data and invalid UTF-8 replacement characters.
  if (text.includes("\u0000") || text.includes("\uFFFD")) {
    return false;
  }

  return true;
};

const uploadToCloudinary = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: file.mimetype.startsWith("image/")
          ? "image"
          : "raw",
        use_filename: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });

const deleteFromCloudinary = (publicId, resourceType) =>
  cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });

const findTaskInProject = (projectId, taskId) =>
  prisma.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, title: true },
  });

const parsePositiveId = (value) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// POST /api/projects/:projectId/tasks/:taskId/attachments
export const uploadAttachment = async (req, res, next) => {
  let uploadedFile;

  try {
    const projectId = parsePositiveId(req.params.projectId);
    const taskId = parsePositiveId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({ message: "Invalid project or task ID." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please select a file to upload." });
    }

    const contentIsValid = await validateAttachmentContent(req.file);

    if(!contentIsValid) {
      return res.status(400).json({
        message: "File contents do not match a supported file type.",
      })
    }

    if (!["ADMIN", "MEMBER"].includes(req.projectMembership.role)) {
      return res.status(403).json({
        message: "Only Admins and Members can upload attachments.",
      });
    }

    const task = await findTaskInProject(projectId, taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found in this project." });
    }

    const folder = `devflow/projects/${projectId}/tasks/${taskId}`;
    uploadedFile = await uploadToCloudinary(req.file, folder);

    const attachment = await prisma.$transaction(async (tx) => {
      const created = await tx.attachment.create({
        data: {
          taskId,
          uploadedById: req.user.id,
          fileName: req.file.originalname,
          fileUrl: uploadedFile.secure_url,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
          storagePublicId: uploadedFile.public_id,
        },
        include: {
          uploadedBy: {
            select: { id: true, username: true, profilePictureUrl: true },
          },
        },
      });

      await recordActivity(tx, {
        projectId,
        taskId,
        userId: req.user.id,
        action: "ATTACHMENT_UPLOADED",
        metadata: {
          attachmentId: created.id,
          fileName: created.fileName,
        },
      });

      return created;
    });

    return res.status(201).json({
      message: "Attachment uploaded successfully.",
      attachment,
    });
  } catch (error) {
    // If Cloudinary upload succeeded but database work failed,
    // attempt to clean up the cloud file.
    if (uploadedFile?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedFile.public_id, {
          resource_type: uploadedFile.resource_type || (req.file.mimetype.startsWith("image/") ? "image" : "raw"),
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError.message);
      }
    }

    next(error);
  }
};

// GET /api/projects/:projectId/tasks/:taskId/attachments
export const getTaskAttachments = async (req, res, next) => {
  try {
    const projectId = parsePositiveId(req.params.projectId);
    const taskId = parsePositiveId(req.params.taskId);

    if (!projectId || !taskId) {
      return res.status(400).json({ message: "Invalid project or task ID." });
    }

    const task = await findTaskInProject(projectId, taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found in this project." });
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploadedBy: {
          select: { id: true, username: true, profilePictureUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ attachments });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/projects/:projectId/tasks/:taskId/attachments/:attachmentId
export const deleteAttachment = async (req, res, next) => {
  try {
    const projectId = parsePositiveId(req.params.projectId);
    const taskId = parsePositiveId(req.params.taskId);
    const attachmentId = parsePositiveId(req.params.attachmentId);

    if (!projectId || !taskId || !attachmentId) {
      return res.status(400).json({ message: "Invalid project, task, or attachment ID." });
    }

    const task = await findTaskInProject(projectId, taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found in this project." });
    }

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, taskId },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found." });
    }

    const isAdmin = req.projectMembership.role === "ADMIN";
    const isUploader = attachment.uploadedById === req.user.id;

    if (!isAdmin && !isUploader) {
      return res.status(403).json({
        message: "Only the uploader or a project Admin can delete this attachment.",
      });
    }

    // Destroy the cloud file before deleting its database record.
    // If Cloudinary fails, retain the database record for a retry.
    const resourceType = attachment.fileType.startsWith("image/")
      ? "image"
      : "raw";

    const cloudResult = await deleteFromCloudinary(
      attachment.storagePublicId,
      resourceType
    );

    if (!["ok", "not found"].includes(cloudResult.result)) {
      return res.status(502).json({
        message: "Could not delete the file from storage. Please retry.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.attachment.delete({ where: { id: attachmentId } });

      await recordActivity(tx, {
        projectId,
        taskId,
        userId: req.user.id,
        action: "ATTACHMENT_DELETED",
        metadata: {
          attachmentId,
          fileName: attachment.fileName,
        },
      });
    });

    return res.status(200).json({
      message: "Attachment deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
