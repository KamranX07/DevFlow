import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../utils/jwt.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { success } from "zod";

const COOKIE_NAME = "devflow_token";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async(req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }

        const { username, email, password } = result.data;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email },
                ],
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    existingUser.username == username 
                    ? "Username already exists" 
                    : "Email already exists", 
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,

                settings: {
                    create: {},
                },
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePictureUrl: true,
                createdAt: true,
            },
        });

        const token = generateToken(user.id);

        res.cookie(COOKIE_NAME, token, cookieOptions);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            user,
        });
    } catch (error) {
        console.error("Register error", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const login = async(req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors, 
            });
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if(!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = generateToken(user.id);

        res.cookie(COOKIE_NAME, token, cookieOptions);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profilePictureUrl: user.profilePictureUrl,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const logout = async (req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user,
    });
};