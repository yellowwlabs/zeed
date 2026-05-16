import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const investmentRouter = createTRPCRouter({
  inviteInvestor: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        investorId: z.string(),
        amount: z.string(),
        customTerms: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.findUniqueOrThrow({
        where: { id: input.dealId },
      });

      // Auth: must be company member
      const membership = await ctx.db.companyMember.findUnique({
        where: {
          userId_companyId: { userId: ctx.session.user.id, companyId: deal.companyId },
        },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

      const instrumentType = deal.dealType === "SAFE_ROUND" ? "SAFE" : "CONVERTIBLE_NOTE";

      const investment = await ctx.db.investment.create({
        data: {
          dealId: input.dealId,
          investorId: input.investorId,
          instrumentType,
          amount: input.amount,
          status: "INVITED",
          terms: input.customTerms ?? (deal.defaultTerms as object),
        },
      });

      await ctx.db.auditEvent.create({
        data: {
          userId: ctx.session.user.id,
          eventType: "INVESTOR_INVITED",
          resourceType: "Investment",
          resourceId: investment.id,
          metadata: { dealId: input.dealId, amount: input.amount },
        },
      });

      return investment;
    }),

  agreeToTerms: protectedProcedure
    .input(z.object({ investmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const investment = await ctx.db.investment.findUniqueOrThrow({
        where: { id: input.investmentId },
        include: { investor: { include: { members: true } } },
      });

      const isMember = investment.investor.members.some(
        (m) => m.userId === ctx.session.user.id
      );
      if (!isMember) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.investment.update({
        where: { id: input.investmentId },
        data: { status: "TERM_AGREED", agreedAt: new Date() },
      });
    }),
});
