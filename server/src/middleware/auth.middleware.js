import prisma from "../config/db.js";
import { verifyToken } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.devflow_token;

        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const decoded = verifyToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId,
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePictureUrl: true,
                createdAt: true,
            },
        });

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "User no longer exist",
            });
        }

        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token",
        });
    }
};