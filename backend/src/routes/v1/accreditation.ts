import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

const INCOME_THRESHOLD_CENTS = 20_000_000n; // $200k
const NET_WORTH_THRESHOLD_CENTS = 100_000_000n; // $1M
const VALIDITY_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

export const accreditationRouter = createTRPCRouter({
  proveByIncome: protectedProcedure
    .input(z.object({
      annualIncomeCents: z.string(),
      contractAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const income = BigInt(input.annualIncomeCents);
      if (income < INCOME_THRESHOLD_CENTS) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Income below $200k threshold" });
      }
      const now = new Date();
      const expires = new Date(now.getTime() + VALIDITY_MS);
      return ctx.db.accreditationProof.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          proofType: "by_income",
          contractAddress: input.contractAddress,
          verifiedAt: now,
          expiresAt: expires,
        },
        update: {
          proofType: "by_income",
          contractAddress: input.contractAddress ?? undefined,
          verifiedAt: now,
          expiresAt: expires,
        },
      });
    }),

  proveByNetWorth: protectedProcedure
    .input(z.object({
      netWorthCents: z.string(),
      contractAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const nw = BigInt(input.netWorthCents);
      if (nw < NET_WORTH_THRESHOLD_CENTS) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Net worth below $1M threshold" });
      }
      const now = new Date();
      const expires = new Date(now.getTime() + VALIDITY_MS);
      return ctx.db.accreditationProof.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          proofType: "by_net_worth",
          contractAddress: input.contractAddress,
          verifiedAt: now,
          expiresAt: expires,
        },
        update: {
          proofType: "by_net_worth",
          contractAddress: input.contractAddress ?? undefined,
          verifiedAt: now,
          expiresAt: expires,
        },
      });
    }),

  getMyProof: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.accreditationProof.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  checkValidity: protectedProcedure.query(async ({ ctx }) => {
    const proof = await ctx.db.accreditationProof.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!proof || proof.proofType === "none") return { valid: false, proof: null };
    return { valid: proof.expiresAt > new Date(), proof };
  }),

  revoke: protectedProcedure.mutation(async ({ ctx }) => {
    const proof = await ctx.db.accreditationProof.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!proof) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No accreditation proof found" });
    }
    return ctx.db.accreditationProof.update({
      where: { userId: ctx.session.user.id },
      data: { proofType: "none", verifiedAt: null, expiresAt: new Date() },
    });
  }),
});
