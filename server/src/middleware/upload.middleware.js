import multer from "multer";

const allowerdMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (req, file, callback) => {
        if (!allowerdMimeTypes.has(file.mimetype)) {
            return callback(
                new Error("Unsupported file type.")
            );
        }

        callback(null, true);
    },
});

export const uploadSingleAttachment = upload.single("file");