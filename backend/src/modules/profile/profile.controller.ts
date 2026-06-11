import { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { createDraftProfileSchema, createProfileSchema, createProfilePersonalSchema, createProfileEducationSchema, createProfileCareerSchema, createProfileFamilySchema, createProfileLifestyleSchema, createProfilePreferenceSchema, createProfileAnswerSchema } from "./profile.validator";

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async getProfiles(req: Request, res: Response): Promise<void> {
    try {
      const profiles = await this.profileService.getProfiles();
      res.status(200).json({ success: true, data: profiles });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch profiles";
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message
        }
      });
    }
  }

  async getProfileById(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const profile = await this.profileService.getProfileById(profileId);
      res.status(200).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch profile";
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message
        }
      });
    }
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profile = await this.profileService.createProfile(validationResult.data);

      res.status(201).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create profile";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createDraft(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createDraftProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      // Assuming agencyId and user ID are populated by your auth middleware
      const agencyId = (req as any).user?.agencyId;
      const assignedUserId = (req as any).user?.id;

      const draft = await this.profileService.createDraft(agencyId, assignedUserId, validationResult.data);

      res.status(201).json({ success: true, data: draft });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create draft profile";
      res.status(400).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async updateDraft(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      const validationResult = createDraftProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const draft = await this.profileService.updateDraft(profileId, validationResult.data);
      res.status(200).json({ success: true, data: draft });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update draft profile";
      res.status(400).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }

  async createProfilePersonal(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfilePersonalSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profilePersonal = await this.profileService.createProfilePersonal(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profilePersonal });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add personal details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileEducation(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileEducationSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileEducation = await this.profileService.createProfileEducation(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileEducation });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add education details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileCareer(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileCareerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileCareer = await this.profileService.createProfileCareer(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileCareer });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add career details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileFamily(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileFamilySchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileFamily = await this.profileService.createProfileFamily(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileFamily });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add family details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileLifestyle(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileLifestyleSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileLifestyle = await this.profileService.createProfileLifestyle(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileLifestyle });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add lifestyle details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfilePreference(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfilePreferenceSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profilePreference = await this.profileService.createProfilePreference(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profilePreference });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add preference details";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async createProfileAnswer(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      
      const validationResult = createProfileAnswerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const profileAnswer = await this.profileService.createProfileAnswer(profileId, validationResult.data);

      res.status(201).json({ success: true, data: profileAnswer });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save profile answer";
      res.status(409).json({
        success: false,
        error: {
          code: "BUSINESS_RULE_ERROR",
          message
        }
      });
    }
  }

  async getProfileAnswers(req: Request, res: Response): Promise<void> {
    try {
      const answers = await this.profileService.getProfileAnswers(req.params.profileId);
      res.status(200).json({ success: true, data: answers });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch answers";
      res.status(404).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }
}