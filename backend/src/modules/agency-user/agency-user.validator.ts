import { z } from "zod";

export const createAgencyUserSchema = z.object({
  agencyId: z.string().uuid("Invalid Agency ID format").or(z.string().min(1, "Agency ID is required")),
  firstName: z.string().min(1, "First Name is required").max(100),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email format").max(200),
  mobile: z.string().min(10, "Mobile number is required").max(20),
  username: z.string().min(1, "Username is required").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([
    "OWNER",
    "PROFILE_MANAGER",
    "MATCHING_MANAGER",
    "RELATIONSHIP_MANAGER"
  ]),
});

export type CreateAgencyUserDTO = z.infer<typeof createAgencyUserSchema>;

export const updateAgencyUserSchema = z.object({
  firstName: z.string().min(1, "First Name is required").max(100).optional(),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email format").max(200).optional(),
  mobile: z.string().min(10, "Mobile number is required").max(20).optional(),
  username: z.string().min(1, "Username is required").max(100).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum([
    "OWNER",
    "PROFILE_MANAGER",
    "MATCHING_MANAGER",
    "RELATIONSHIP_MANAGER"
  ]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export type UpdateAgencyUserDTO = z.infer<typeof updateAgencyUserSchema>;