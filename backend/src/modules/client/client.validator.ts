import { z } from "zod";

export const createClientSchema = z.object({
  firstName: z.string().min(1, "First Name is required").max(100),
  lastName: z.string().max(100).optional(),
  gender: z.string().min(1, "Gender is required").max(20),
  dob: z.coerce.date().optional(),
  mobile: z.string().max(20).optional(),
  // If email is provided, it must be a valid email format
  email: z.string().email("Invalid email format").max(200).optional(),
});

export type CreateClientDTO = z.infer<typeof createClientSchema>;