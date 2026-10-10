import { z } from "zod";

export const createInvitationSchema = z.object({
    identifier: z
        .string()
        .trim()
        .min(1, "Username or email is required"),

    role: z.enum(["MEMBER", "VIEWER"]),
});