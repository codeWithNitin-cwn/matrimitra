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
  updatedBy: z.string().uuid("Invalid User ID format"),
});

export const updatePipelineSchema = z.object({
  currentStage: z.enum(stages),
  updatedBy: z.string().uuid("Invalid User ID format"),
});

export type CreatePipelineDTO = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineDTO = z.infer<typeof updatePipelineSchema>;