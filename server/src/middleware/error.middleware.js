export const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (err, req, res, next) => {
    console.error("API Error:", {
        method: req.method,
        path: req.originalUrl,
        message: err.message,
    });

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = 
        Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode <= 599
            ? err.statusCode
            : 500;
    
    return res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : err.message || "Request failed",
    });
};