const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfProtection = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    // Reject requests explicitly identified as cross-site by browsers.
    if (req.get("Sec-Fetch-Site") === "cross-site") {
        return res.status(403).json({
            success: false,
            message: "Cross-site requests are not allowed.",
        });
    }

    const allowedOrigin = process.env.CLIENT_URL;

    if(!allowedOrigin) {
        return next(
            new Error("CLIENT_URL must be configured for CSRF protection.")
        );
    }

    const origin = req.get("Origin");

    if (origin) {
        if (origin !== allowedOrigin) {
            return res.status(403).json({
                success: false,
                message: "Invalid request origin.",
            });
        }

        return next();
    }

    // Some clients omit Origin; validate Referer when available.
    const referer = req.get("Referer");

    if (referer) {
        try {
            if (new URL(referer).origin !== allowedOrigin) {
                return res.status(403).json({
                    success: false,
                    message: "Invalid request origin.",
                });
            }
        } catch {
            return res.status(403).json({
                success: false,
                message: "Invalid request origin.",
            });
        }
    }

    // Requests without browser origin headers may be API clients such as Postman.
    return next();
}