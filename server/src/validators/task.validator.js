import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  deadline: z
    .union([z.string().datetime({ offset: true }), z.null()])
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  deadline: z
    .union([z.string().datetime({ offset: true }), z.null()])
    .optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
});

export const updateTaskAssigneesSchema = z.object({
  userIds: z.array(z.number().int().positive()).max(100),
});