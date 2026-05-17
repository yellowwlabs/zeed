import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

export class AuthService {
  constructor(private db: PrismaClient) {}

  async findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: { email: string; name: string; passwordHash?: string }) {
    return this.db.user.create({
      data,
      select: { id: true, email: true, name: true },
    });
  }

  async findUserById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        companyMembers: { include: { company: true } },
        investorMembers: { include: { investor: true } },
      },
    });
  }

  async hashPassword(password: string) {
    return argon2.hash(password);
  }

  async verifyPassword(passwordHash: string, password: string) {
    return argon2.verify(passwordHash, password);
  }

  async createSession(userId: string) {
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.db.session.create({
      data: {
        sessionToken,
        userId,
        expires,
      },
    });
  }

  async deleteSession(sessionToken: string) {
    return this.db.session.delete({
      where: { sessionToken },
    });
  }
}
