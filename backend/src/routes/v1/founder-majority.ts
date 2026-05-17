import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const founderMajorityRouter = createTRPCRouter({
  publishProof: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        founderShares: z.string(),
        totalDilutedShares: z.string(),
        thresholdBps: z.number().int().min(0).max(10000),
        contractAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.companyMember.findUnique({
        where: { userId_companyId: { userId: ctx.session.user.id, companyId: input.companyId } },
      });
      if (!member) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not a company member" });
      }

      const founders = BigInt(input.founderShares);
      const total = BigInt(input.totalDilutedShares);
      const threshold = BigInt(input.thresholdBps);

      if (total === 0n) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Total shares must be positive" });
      }
      if (founders > total) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Founders cannot exceed total shares" });
      }
      if (founders * 10000n < threshold * total) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Founders below threshold" });
      }

      return ctx.db.founderMajorityProof.upsert({
        where: { companyId: input.companyId },
        create: {
          companyId: input.companyId,
          contractAddress: input.contractAddress,
          thresholdBps: input.thresholdBps,
          lastProofValid: true,
          proofCount: 1,
          provedAt: new Date(),
        },
        update: {
          contractAddress: input.contractAddress ?? undefined,
          thresholdBps: input.thresholdBps,
          lastProofValid: true,
          proofCount: { increment: 1 },
          provedAt: new Date(),
        },
      });
    }),

  getProof: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.founderMajorityProof.findUnique({
        where: { companyId: input.companyId },
      });
    }),

  isCurrentlyValid: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const proof = await ctx.db.founderMajorityProof.findUnique({
        where: { companyId: input.companyId },
      });
      return { valid: proof?.lastProofValid ?? false };
    }),
});
