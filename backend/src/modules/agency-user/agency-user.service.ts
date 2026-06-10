import * as bcrypt from "bcrypt";
import { AgencyUserRepository } from "./agency-user.repository";
import { CreateAgencyUserDTO } from "./agency-user.validator";

export class AgencyUserService {
  private repository: AgencyUserRepository;

  constructor() {
    this.repository = new AgencyUserRepository();
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
      username: data.username,
      email: data.email,
      mobile: data.mobile,
      passwordHash,
      role: data.role,
      status: "ACTIVE",
    });
  }
}