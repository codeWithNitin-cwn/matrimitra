import { ClientRepository } from "./client.repository";
import { CreateClientDTO, UpdateClientDTO, CreateClientNoteDTO, CreatePaymentDTO } from "./client.validator";
import { prisma } from "../../config/prisma";
import crypto from "crypto";

export class ClientService {
  private repository: ClientRepository;

  constructor() {
    this.repository = new ClientRepository();
  }

  private async verifyClientOwnership(clientId: string, queryingAgencyId: string) {
    const client = await this.repository.findById(clientId, queryingAgencyId);
    if (!client) {
      throw new Error("Client not found or unauthorized");
    }
    return client;
  }

  async getClients(agencyId: string) {
    return this.repository.findAll(agencyId);
  }

  async getClientById(clientId: string, agencyId: string, userId: string) {
    const client = await this.verifyClientOwnership(clientId, agencyId);
    
    await prisma.auditLog.create({
      data: {
        agencyId,
        userId,
        entityType: "CLIENT",
        entityId: clientId,
        action: "VIEW"
      }
    });

    return client;
  }

  async createClient(agencyId: string, userId: string, data: CreateClientDTO) {
    // Generate business-friendly client code: CL-YYYYMMDD-ff38a2c1
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const clientCode = `CL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;

    const client = await this.repository.create({
      agencyId,
      clientCode,
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email || null,
      mobile: data.mobile,
      status: data.status || "LEAD",
      leadSource: data.leadSource || null,
      assignedUserId: data.assignedUserId || null,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
    });

    await prisma.auditLog.create({
      data: {
        agencyId,
        userId,
        entityType: "CLIENT",
        entityId: client.id,
        action: "CREATE"
      }
    });

    return client;
  }

  async updateClient(clientId: string, agencyId: string, userId: string, data: UpdateClientDTO) {
    await this.verifyClientOwnership(clientId, agencyId);

    const updateData: any = { ...data };
    if (data.nextFollowUpAt !== undefined) {
      updateData.nextFollowUpAt = data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null;
    }

    const client = await this.repository.updateById(clientId, updateData);

    await prisma.auditLog.create({
      data: {
        agencyId,
        userId,
        entityType: "CLIENT",
        entityId: clientId,
        action: "UPDATE"
      }
    });

    return client;
  }

  async addNote(clientId: string, agencyId: string, userId: string, data: CreateClientNoteDTO) {
    await this.verifyClientOwnership(clientId, agencyId);

    const note = await this.repository.createNote({
      clientId,
      authorId: userId,
      content: data.content
    });

    await prisma.auditLog.create({
      data: {
        agencyId,
        userId,
        entityType: "CLIENT_NOTE",
        entityId: note.id,
        action: "CREATE"
      }
    });

    return note;
  }

  async getNotes(clientId: string, agencyId: string) {
    await this.verifyClientOwnership(clientId, agencyId);
    return this.repository.findNotes(clientId);
  }

  async addPayment(clientId: string, agencyId: string, userId: string, data: CreatePaymentDTO) {
    await this.verifyClientOwnership(clientId, agencyId);

    const payment = await this.repository.createPayment({
      clientId,
      agencyId,
      amount: data.amount,
      currency: data.currency || "INR",
      status: data.status || "PENDING",
      paymentMethod: data.paymentMethod || null,
      transactionId: data.transactionId || null,
      remarks: data.remarks || null,
    });

    await prisma.auditLog.create({
      data: {
        agencyId,
        userId,
        entityType: "PAYMENT",
        entityId: payment.id,
        action: "CREATE"
      }
    });

    return payment;
  }

  async getPayments(clientId: string, agencyId: string) {
    await this.verifyClientOwnership(clientId, agencyId);
    return this.repository.findPayments(clientId);
  }
}