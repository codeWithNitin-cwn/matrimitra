import { z } from "zod";

export const createProposalSchema = z.object({
  senderAgencyId: z.string().uuid("Invalid Sender Agency ID"),
  receiverAgencyId: z.string().uuid("Invalid Receiver Agency ID"),
  brideProfileId: z.string().uuid("Invalid Bride Profile ID"),
  groomProfileId: z.string().uuid("Invalid Groom Profile ID"),
  proposalNotes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  createdBy: z.string().uuid("Creator User ID is required"),
});

export type CreateProposalDTO = z.infer<typeof createProposalSchema>;

export const addActivitySchema = z.object({
  activityNotes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  performedBy: z.string().uuid("User ID performing the action is required"),
});

export type AddActivityDTO = z.infer<typeof addActivitySchema>;