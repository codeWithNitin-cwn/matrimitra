import { AgencyRepository } from "./agency.repository";
import { CreateAgencyDTO } from "./agency.validator";

export class AgencyService {
  private repository: AgencyRepository;

  constructor() {
    this.repository = new AgencyRepository();
  }

  async createAgency(data: CreateAgencyDTO) {
    const existingCode = await this.repository.findByCode(data.agencyCode);
    if (existingCode) {
      throw new Error("Agency code already exists");
    }

    const existingEmail = await this.repository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error("Agency email already exists");
    }

    return this.repository.create({
      agencyCode: data.agencyCode,
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      city: data.city,
      state: data.state,
      country: data.country,
      registrationNo: data.registrationNo,
      website: data.website,
      status: "ACTIVE", // As defined in AgencyStatus enum
    });
  }
}