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
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const profiles = await this.profileService.getProfiles(agencyId);
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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      const viewerProfileId = req.query.viewerProfileId as string | undefined;
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }
      const profile = await this.profileService.getProfileById(profileId, agencyId, userId, viewerProfileId);
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
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profileData = { ...validationResult.data, agencyId };
      const profile = await this.profileService.createProfile(profileData);

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
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      const validationResult = createDraftProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const draft = await this.profileService.updateDraft(profileId, agencyId, userId, validationResult.data);
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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfilePersonalSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profilePersonal = await this.profileService.createProfilePersonal(profileId, agencyId, validationResult.data);

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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfileEducationSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profileEducation = await this.profileService.createProfileEducation(profileId, agencyId, validationResult.data);

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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfileCareerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profileCareer = await this.profileService.createProfileCareer(profileId, agencyId, validationResult.data);

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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfileFamilySchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profileFamily = await this.profileService.createProfileFamily(profileId, agencyId, validationResult.data);

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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfileLifestyleSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profileLifestyle = await this.profileService.createProfileLifestyle(profileId, agencyId, validationResult.data);

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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfilePreferenceSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
          }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profilePreference = await this.profileService.createProfilePreference(profileId, agencyId, validationResult.data);

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
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      
      const validationResult = createProfileAnswerSchema.safeParse(req.body);

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ")
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
      const { profileId } = req.params;
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      const answers = await this.profileService.getProfileAnswers(profileId);
      res.status(200).json({ success: true, data: answers });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch answers";
      res.status(404).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      const { status, reason } = req.body;
      if (!status || !["DRAFT", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "ARCHIVED", "AGENCY_COMPLETED", "ONBOARDING_SENT", "CLIENT_APPROVED", "AGENCY_APPROVED", "ACTIVE", "CORRECTION_REQUESTED", "CLIENT_UPDATED"].includes(status)) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid status value" } });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const profile = await this.profileService.updateStatus(profileId, agencyId, userId, status, reason, userRole);
      res.status(200).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile status";
      res.status(409).json({
        success: false,
        error: { code: "BUSINESS_RULE_ERROR", message }
      });
    }
  }

  async generateOnboardingLink(req: Request, res: Response): Promise<void> {
    try {
      const profileId = req.params.profileId as string;
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const result = await this.profileService.generateOnboardingLink(profileId, agencyId);
      res.status(200).json({ success: true, data: result });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate onboarding link";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getClientProfileByToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const profile = await this.profileService.getClientProfileByToken(token);
      res.status(200).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch onboarding profile";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async clientApproveProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const profile = await this.profileService.clientApproveProfile(token);
      res.status(200).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to approve profile";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async clientUpdateProfile(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const profile = await this.profileService.clientUpdateProfile(token, req.body);
      res.status(200).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async clientRequestChanges(req: Request, res: Response): Promise<void> {
    try {
      const token = req.params.token as string;
      const { reason } = req.body;
      const profile = await this.profileService.clientRequestChanges(token, reason);
      res.status(200).json({ success: true, data: profile });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit change request";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async uploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file uploaded" } });
        return;
      }
      const isPrimary = req.body.isPrimary === "true" || req.body.isPrimary === true;
      const photo = await this.profileService.uploadPhoto(profileId, req.file, isPrimary);
      res.status(201).json({ success: true, data: photo });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload photo";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async clientUploadPhoto(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      if (typeof token !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid token format" } });
        return;
      }
      if (!req.file) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No file uploaded" } });
        return;
      }
      const photo = await this.profileService.clientUploadPhoto(token, req.file);
      res.status(201).json({ success: true, data: photo });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to upload photo";
      res.status(400).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async logAccess(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }
      const { action } = req.body;
      if (!action || !["VIEW_PROFILE", "VIEW_PHOTOS", "DOWNLOAD_DOCUMENT"].includes(action)) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid action value" } });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      const log = await this.profileService.logAccess(profileId, agencyId, userId, action);
      res.status(201).json({ success: true, data: log });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to log access";
      res.status(500).json({
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message }
      });
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { profileId } = req.params;
      if (typeof profileId !== "string") {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid profile ID format" } });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userRole = (req as any).user?.role;
      if (!agencyId || !userRole) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized agency access" } });
        return;
      }

      await this.profileService.deleteProfile(profileId, agencyId, userRole);
      res.status(200).json({ success: true, message: "Profile deleted successfully" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete profile";
      if (message.includes("Unauthorized")) {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message } });
        return;
      }
      if (message.includes("Invalid profile status")) {
        res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message } });
        return;
      }
      if (message.includes("Profile not found")) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
        return;
      }
      res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message } });
    }
  }
}