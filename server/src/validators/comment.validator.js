import { z } from "zod";

export const createCommentSchema = z.object({
    message: z.string().trim().min(1).max(5000),
});

export const updateCommentSchema = z.object({
    message: z.string().trim().min(1).max(5000),
});