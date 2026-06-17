import { z } from "zod";

export const createProposalSchema = z.object({
  receiverAgencyId: z.string().uuid("Invalid Receiver Agency ID"),
  brideProfileId: z.string().uuid("Invalid Bride Profile ID"),
  groomProfileId: z.string().uuid("Invalid Groom Profile ID"),
  proposalNotes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  // senderAgencyId and createdBy are derived from the authenticated JWT — not accepted from client body
});

export type CreateProposalDTO = z.infer<typeof createProposalSchema>;

export const addActivitySchema = z.object({
  activityNotes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  // performedBy is derived from the authenticated JWT — not accepted from client body
});

export type AddActivityDTO = z.infer<typeof addActivitySchema>;