import { z } from "zod";

const stages = [
  "NEW_PROPOSAL",
  "PROFILE_SHARED",
  "INTERESTED",
  "MEETING_SCHEDULED",
  "FAMILY_DISCUSSION",
  "ENGAGEMENT",
  "MARRIED",
  "CLOSED"
] as const;

export const createPipelineSchema = z.object({
  proposalId: z.string().uuid("Invalid Proposal ID format"),
  currentStage: z.enum(stages).default("NEW_PROPOSAL"),
  // updatedBy is derived from the authenticated JWT — not accepted from client body
});

export const updatePipelineSchema = z.object({
  currentStage: z.enum(stages),
  // updatedBy is derived from the authenticated JWT — not accepted from client body
  notes: z.string().max(1000).optional(),
});

export type CreatePipelineDTO = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineDTO = z.infer<typeof updatePipelineSchema>;