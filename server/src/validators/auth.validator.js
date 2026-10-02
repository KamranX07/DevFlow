import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters"),
    
    email: z
        .string()
        .trim()
        .email("Invalid email address"),
        
    password: z
        .string()
        .trim()
        .min(8, "Password must be at least 8 characters")
        .max(100, "Password cannot exceed 100 characters"),
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address"),

    password: z
        .string()
        .min(1, "Password is required"),
});