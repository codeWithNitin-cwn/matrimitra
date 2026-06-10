import { z } from "zod";

export const createAgencySchema = z.object({
  agencyCode: z.string().min(1, "Agency Code is required").max(20),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format").max(200),
  mobile: z.string().min(10, "Mobile number is required").max(20),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  registrationNo: z.string().max(100).optional(),
  website: z.string().url("Invalid website URL").max(300).optional()
});

export type CreateAgencyDTO = z.infer<typeof createAgencySchema>;