import * as bcrypt from "bcrypt";
import { AgencyUserRepository } from "./agency-user.repository";
import { CreateAgencyUserDTO, UpdateAgencyUserDTO } from "./agency-user.validator";

export class AgencyUserService {
  private repository: AgencyUserRepository;

  constructor() {
    this.repository = new AgencyUserRepository();
  }

  async getAgencyUsers(agencyId: string) {
    return this.repository.findAll(agencyId);
  }

  async createAgencyUser(data: CreateAgencyUserDTO) {
    const existingEmail = await this.repository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("Agency user email already exists");
    }

    const existingUsername = await this.repository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error("Agency user username already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.repository.create({
      agencyId: data.agencyId,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      email: data.email,
      mobile: data.mobile,
      passwordHash,
      role: data.role,
      status: "ACTIVE",
    });
  }

  async updateAgencyUser(id: string, agencyId: string, currentUserId: string, data: UpdateAgencyUserDTO) {
    const user = await this.repository.findById(id, agencyId);
    if (!user) {
      throw new Error("Agency user not found");
    }

    if (id === currentUserId) {
      if (data.status === "INACTIVE") {
        throw new Error("You cannot deactivate your own account");
      }
      if (data.role && data.role !== user.role) {
        throw new Error("You cannot change your own role");
      }
    }

    const updateData: any = { ...data };

    if (data.email && data.email !== user.email) {
      const existingEmail = await this.repository.findByEmail(data.email);
      if (existingEmail) {
        throw new Error("Email already in use");
      }
    }

    if (data.username && data.username !== user.username) {
      const existingUsername = await this.repository.findByUsername(data.username);
      if (existingUsername) {
        throw new Error("Username already in use");
      }
    }

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    return this.repository.update(id, agencyId, updateData);
  }
}