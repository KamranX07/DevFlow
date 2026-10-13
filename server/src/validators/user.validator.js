import { z } from "zod";

export const updateProfileSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters.")
        .max(30, "Username cannot exceed 30 characters.")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can contain only letters, numbers, and underscores."
        )
        .optional(),
})
.strict()
.refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one filed to update."
);