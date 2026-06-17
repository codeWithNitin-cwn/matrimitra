import { z } from "zod";

export const clientStatusEnum = z.enum(["LEAD", "ACTIVE", "INACTIVE"]);
export const paymentStatusEnum = z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]);
export const leadSourceEnum = z.enum(["WEBSITE", "REFERENCE", "WALK_IN", "INSTAGRAM", "FACEBOOK", "WHATSAPP"]);

export const createClientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  mobile: z.string().min(10, "Mobile number is required").max(20),
  status: clientStatusEnum.default("LEAD"),
  leadSource: leadSourceEnum.optional().nullable(),
  assignedUserId: z.string().uuid("Invalid User ID").optional().nullable(),
  nextFollowUpAt: z.string().datetime().optional().nullable(),
});

export type CreateClientDTO = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();
export type UpdateClientDTO = z.infer<typeof updateClientSchema>;

export const createClientNoteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});
export type CreateClientNoteDTO = z.infer<typeof createClientNoteSchema>;

export const createPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  status: paymentStatusEnum.default("PENDING"),
  paymentMethod: z.string().optional().nullable(),
  transactionId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});
export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;