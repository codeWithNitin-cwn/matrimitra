import { Request, Response } from "express";
import { ClientService } from "./client.service";
import { createClientSchema, updateClientSchema, createClientNoteSchema, createPaymentSchema } from "./client.validator";

export class ClientController {
  private clientService: ClientService;

  constructor() {
    this.clientService = new ClientService();
  }

  async getClients(req: Request, res: Response): Promise<void> {
    try {
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }
      const clients = await this.clientService.getClients(agencyId);
      res.status(200).json({ success: true, data: clients });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch clients";
      res.status(500).json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message } });
    }
  }

  async getClientById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }
      const client = await this.clientService.getClientById(id, agencyId, userId);
      res.status(200).json({ success: true, data: client });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch client";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async createClient(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = createClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }

      const client = await this.clientService.createClient(agencyId, userId, validationResult.data);
      res.status(201).json({ success: true, data: client });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create client";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validationResult = updateClientSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }

      const client = await this.clientService.updateClient(id, agencyId, userId, validationResult.data);
      res.status(200).json({ success: true, data: client });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update client";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async addNote(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validationResult = createClientNoteSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }

      const note = await this.clientService.addNote(id, agencyId, userId, validationResult.data);
      res.status(201).json({ success: true, data: note });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add note";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }
      const notes = await this.clientService.getNotes(id, agencyId);
      res.status(200).json({ success: true, data: notes });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch notes";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }

  async addPayment(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const validationResult = createPaymentSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(", ") }
        });
        return;
      }

      const agencyId = (req as any).user?.agencyId;
      const userId = (req as any).user?.id;
      if (!agencyId || !userId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }

      const payment = await this.clientService.addPayment(id, agencyId, userId, validationResult.data);
      res.status(201).json({ success: true, data: payment });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to add payment";
      res.status(409).json({ success: false, error: { code: "BUSINESS_RULE_ERROR", message } });
    }
  }

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const agencyId = (req as any).user?.agencyId;
      if (!agencyId) {
        res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } });
        return;
      }
      const payments = await this.clientService.getPayments(id, agencyId);
      res.status(200).json({ success: true, data: payments });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch payments";
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message } });
    }
  }
}