import { ClientRepository } from "./client.repository";
import { CreateClientDTO } from "./client.validator";

export class ClientService {
  private repository: ClientRepository;

  constructor() {
    this.repository = new ClientRepository();
  }

  async createClient(data: CreateClientDTO) {
    // Only check for duplicate emails if an email was actually provided
    if (data.email) {
      const existingEmail = await this.repository.findByEmail(data.email);
      if (existingEmail) {
        throw new Error("Client email already exists");
      }
    }

    // Create the record in the Person table
    return this.repository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      dob: data.dob,
      mobile: data.mobile,
      email: data.email,
    });
  }
}