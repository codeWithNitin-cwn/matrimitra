import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class ClientRepository {
  async create(data: Prisma.ClientUncheckedCreateInput) {
    return prisma.client.create({ data });
  }

  async findAll(agencyId: string) {
    return prisma.client.findMany({
      where: { agencyId },
      include: {
        assignedUser: true,
        _count: {
          select: { profiles: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string, agencyId: string) {
    return prisma.client.findFirst({
      where: { id, agencyId },
      include: {
        assignedUser: true,
        profiles: true,
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateById(id: string, data: Prisma.ClientUncheckedUpdateInput) {
    return prisma.client.update({
      where: { id },
      data
    });
  }

  async createNote(data: Prisma.ClientNoteUncheckedCreateInput) {
    return prisma.clientNote.create({
      data,
      include: { author: true }
    });
  }

  async findNotes(clientId: string) {
    return prisma.clientNote.findMany({
      where: { clientId },
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPayment(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  }

  async findPayments(clientId: string) {
    return prisma.payment.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' }
    });
  }
}