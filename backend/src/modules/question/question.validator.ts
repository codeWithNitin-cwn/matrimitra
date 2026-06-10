import { z } from "zod";

export const createQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required"),
  category: z.enum([
    "PERSONALITY",
    "RELATIONSHIP",
    "LIFESTYLE",
    "FAMILY_VALUES",
    "FUN"
  ]),
  options: z.array(z.object({ optionText: z.string().min(1) })).min(2, "At least 2 options required")
});

export type CreateQuestionDTO = z.infer<typeof createQuestionSchema>;