// src/server/api/routers/auth.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import argon2 from "argon2";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1).max(120),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const passwordHash = await argon2.hash(input.password);
      const user = await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
        },
        select: { id: true, email: true, name: true },
      });

      return user;
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        companyMembers: { include: { company: true } },
        investorMembers: { include: { investor: true } },
      },
    });
  }),
});
