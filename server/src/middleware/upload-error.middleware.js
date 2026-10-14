import multer from "multer";

export const handleUploadError = (err, req, res, next) => {
    if ((!err instanceof multer.MulterError) &&
        err.message !== "Unsupported file type." &&
        err.message !== "Only JPEG, PNG, and WebP images are allowed.") {
        return next(err);
    }

    if (err instanceof multer.MulterError) {
        const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;

        return res.status(statusCode).json({
            success: false,
            message:
                err.code === "LIMIT_FILE_SIZE"
                    ? "File exceeds the allowed size limit."
                    : "Invalid file upload.",
        });
    }

    return res.status(400).json({
        success: false,
        message: err.message,
    });
};