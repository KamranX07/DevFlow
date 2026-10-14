import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    theme: z.enum(["system", "light", "dark"]).optional(),
    emailNotifications: z.boolean().optional(),
    taskNotifications: z.boolean().optional(),
    commentNotifications: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one setting to update."
  );

export const updateNotificationSettingsSchema = z
  .object({
    emailNotifications: z.boolean().optional(),
    taskNotifications: z.boolean().optional(),
    commentNotifications: z.boolean().optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Provide at least one notification setting to update."
  );
