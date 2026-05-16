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

  static async signIn({
    input,
    db,
  }: {
    input: { email: string; password: string };
    db: PrismaClient;
  }) {
    const authService = new AuthService(db);
    const user = await authService.findUserByEmail(input.email);
    if (!user?.passwordHash) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    }

    const valid = await authService.verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
    }

    const session = await authService.createSession(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      sessionToken: session.sessionToken,
    };
  }

  static async signOut({
    input,
    db,
  }: {
    input: { sessionToken: string };
    db: PrismaClient;
  }) {
    const authService = new AuthService(db);
    await authService.deleteSession(input.sessionToken);
    return { success: true };
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
