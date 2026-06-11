import { z } from "zod";

export const createDraftProfileSchema = z.object({
  name: z.string().optional(),
  gender: z.string().optional(),
  dob: z.string().optional(),
  age: z.string().or(z.number()).optional(),
  height: z.string().optional(),
  religion: z.string().optional(),
  caste: z.string().optional(),
  motherTongue: z.string().optional(),
  maritalStatus: z.string().optional(),
  city: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  degree: z.string().optional(),
  college: z.string().optional(),
  occupation: z.string().optional(),
  company: z.string().optional(),
  salary: z.string().optional(),
  father: z.string().optional(),
  mother: z.string().optional(),
  siblings: z.string().optional(),
  ageRange: z.string().optional(),
  heightRange: z.string().optional(),
  educationPreference: z.string().optional(),
});

export const createProfileSchema = z.object({
  agencyId: z.string().uuid("Invalid Agency ID format").or(z.string().min(1, "Agency ID is required")),
  personId: z.string().uuid("Invalid Person ID format").or(z.string().min(1, "Person ID is required")),
  assignedUserId: z.string().uuid("Invalid Assigned User ID format").optional(),
  profileNumber: z.string().min(1, "Profile Number is required").max(50),
  profileType: z.string().min(1, "Profile Type is required").max(20),
});

export type CreateProfileDTO = z.infer<typeof createProfileSchema>;

export const createProfilePersonalSchema = z.object({
  religion: z.string().max(100).optional(),
  caste: z.string().max(100).optional(),
  subCaste: z.string().max(100).optional(),
  motherTongue: z.string().max(100).optional(),
  heightCm: z.number().int().positive("Height must be a positive number").optional(),
  weightKg: z.number().int().positive("Weight must be a positive number").optional(),
  maritalStatus: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
});

export type CreateProfilePersonalDTO = z.infer<typeof createProfilePersonalSchema>;

export const createProfileEducationSchema = z.object({
  qualification: z.string().min(1, "Qualification is required").max(100),
  specialization: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  graduationYear: z.number().int().min(1900, "Invalid year").max(new Date().getFullYear() + 10, "Invalid year").optional(),
});

export type CreateProfileEducationDTO = z.infer<typeof createProfileEducationSchema>;

export const createProfileCareerSchema = z.object({
  profession: z.string().max(100).optional(),
  employer: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  annualIncome: z.number().positive("Income must be a positive number").optional(),
  workLocation: z.string().max(100).optional(),
});

export type CreateProfileCareerDTO = z.infer<typeof createProfileCareerSchema>;

export const createProfileFamilySchema = z.object({
  fatherName: z.string().max(100).optional(),
  motherName: z.string().max(100).optional(),
  fatherOccupation: z.string().max(100).optional(),
  motherOccupation: z.string().max(100).optional(),
  familyType: z.string().max(50).optional(),
  familyValues: z.string().max(50).optional(),
  siblingsCount: z.number().int().min(0, "Siblings count cannot be negative").optional(),
});

export type CreateProfileFamilyDTO = z.infer<typeof createProfileFamilySchema>;

export const createProfileLifestyleSchema = z.object({
  foodHabit: z.string().max(100).optional(),
  smoking: z.boolean().optional(),
  drinking: z.boolean().optional(),
  fitnessLevel: z.string().max(100).optional(),
  hobbies: z.any().optional(), // Accepts arrays or objects for Prisma Json field
});

export type CreateProfileLifestyleDTO = z.infer<typeof createProfileLifestyleSchema>;

const priorityEnum = z.enum(["MUST_HAVE", "IMPORTANT", "PREFERRED", "DOESNT_MATTER"]);

export const createProfilePreferenceSchema = z.object({
  minAge: z.number().int().min(18, "Minimum age is 18").optional(),
  maxAge: z.number().int().max(100, "Maximum age is 100").optional(),
  agePriority: priorityEnum.optional(),
  minHeight: z.number().int().positive().optional(),
  maxHeight: z.number().int().positive().optional(),
  heightPriority: priorityEnum.optional(),
  religion: z.string().max(100).optional(),
  religionPriority: priorityEnum.optional(),
  caste: z.string().max(100).optional(),
  castePriority: priorityEnum.optional(),
  city: z.string().max(100).optional(),
  cityPriority: priorityEnum.optional(),
  education: z.string().max(100).optional(),
  educationPriority: priorityEnum.optional(),
  profession: z.string().max(100).optional(),
  professionPriority: priorityEnum.optional(),
});

export type CreateProfilePreferenceDTO = z.infer<typeof createProfilePreferenceSchema>;

export const createProfileAnswerSchema = z.object({
  questionId: z.string().uuid("Invalid Question ID format"),
  selectedOptionId: z.string().uuid("Invalid Option ID format"),
  importance: z.enum(["MUST_HAVE", "NICE_TO_HAVE", "DOESNT_MATTER"]),
});

export type CreateProfileAnswerDTO = z.infer<typeof createProfileAnswerSchema>;