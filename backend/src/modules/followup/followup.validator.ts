import { z } from "zod";

export const createFollowUpSchema = z.object({
  profileId: z.string().uuid("Invalid Profile ID"),
  proposalId: z.string().uuid("Invalid Proposal ID").optional(),
  assignedUserId: z.string().uuid("Invalid Assigned User ID"),
  dueDate: z.string().datetime().or(z.date()),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
});

export type CreateFollowUpDTO = z.infer<typeof createFollowUpSchema>;

export const updateFollowUpSchema = z.object({
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
});

export type UpdateFollowUpDTO = z.infer<typeof updateFollowUpSchema>;
