import { z } from "zod";
import { withRequiredPreprocess } from "./validation.utils";

export const loginSchema = z.object({
  email: withRequiredPreprocess(
    z
      .string()
      .min(1, "Email is required")
      .pipe(z.email("Invalid email address")),
  ),
  password: withRequiredPreprocess(
    z
      .string()
      .min(1, "Password is required")
      .pipe(z.string().min(6, "Password must be at least 6 characters long")),
  ),
});
