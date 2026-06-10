import { z } from "zod";

export const createAgencyUserSchema = z.object({
  agencyId: z.string().uuid("Invalid Agency ID format").or(z.string().min(1, "Agency ID is required")),
  firstName: z.string().min(1, "First Name is required").max(100),
  email: z.string().email("Invalid email format").max(200),
  mobile: z.string().min(10, "Mobile number is required").max(20),
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([
    "OWNER",
    "MANAGER",
    "EXECUTIVE",
    "VIEWER"
  ]),
});

export type CreateAgencyUserDTO = z.infer<typeof createAgencyUserSchema>;