import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { InvestmentController } from "../../controllers/investment.controller";

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
      return InvestmentController.inviteInvestor({ ctx, input, db: ctx.db });
    }),

  agreeToTerms: protectedProcedure
    .input(z.object({ investmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return InvestmentController.agreeToTerms({ ctx, input, db: ctx.db });
    }),
});
