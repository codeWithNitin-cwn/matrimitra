import type { StringValue } from "ms";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRepository } from "./auth.repository";
import { LoginDTO } from "./auth.validator";
import type { JwtPayload } from "./auth.types";
import { prisma } from "../../config/prisma";

function isStringValue(val: string): val is StringValue {
  return /^\d+\s*[a-zA-Z]*$/.test(val);
}

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async login(data: LoginDTO): Promise<{ token: string; user: JwtPayload }> {
    const user = await this.repository.findUserByEmail(data.email);
    
    if (!user) {
      throw new Error("Invalid email or password");
    }
    
    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new Error("User account is inactive");
    }

    const payload: JwtPayload = {
      id: user.id,
      agencyId: user.agencyId,
      role: user.role,
    };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1d";
    let expiresIn: StringValue | number = "1d";
    if (isStringValue(jwtExpiresIn)) {
      expiresIn = jwtExpiresIn;
    }

    const token = jwt.sign(payload, jwtSecret, { 
      expiresIn,
    });

    await prisma.auditLog.create({
      data: {
        agencyId: user.agencyId,
        userId: user.id,
        entityType: "USER",
        entityId: user.id,
        action: "LOGIN"
      }
    });

    return { token, user: payload };
  }
}