import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "name is required"),
  email: z.email("valid email is required"),
});

export const updateUserSchema = createUserSchema.partial();
