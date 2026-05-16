import { TRPCError } from "@trpc/server";
import { AuthService } from "../services/auth.service";
import { PrismaClient } from "@prisma/client";

export class AuthController {
  static async signUp({
    input,
    db,
  }: {
    input: any;
    db: PrismaClient;
  }) {
    const authService = new AuthService(db);
    const existing = await authService.findUserByEmail(input.email);
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
    }

    const passwordHash = await authService.hashPassword(input.password);
    const user = await authService.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
    });

    return user;
  }

  static async me({
    ctx,
    db,
  }: {
    ctx: any;
    db: PrismaClient;
  }) {
    const authService = new AuthService(db);
    return authService.findUserById(ctx.session.user.id);
  }
}
