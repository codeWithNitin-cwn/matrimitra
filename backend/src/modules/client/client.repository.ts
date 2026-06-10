import { prisma } from "../../config/prisma";
import { Prisma } from "../../generated/prisma/client";

export class ClientRepository {
  async findByEmail(email: string) {
    // Using findFirst to safely query in case email is not strictly @unique in the Person model
    return prisma.person.findFirst({ where: { email } });
  }

  async create(data: Prisma.PersonCreateInput) {
    return prisma.person.create({ data });
  }
}