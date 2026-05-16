import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { InvestorController } from "../../controllers/investor.controller";
import { investorMemberProcedure } from "../../middlewares/role.middleware";

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().default("USA"),
});

export const investorRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        entityName: z.string().min(1).max(200),
        entityType: z.enum(["INDIVIDUAL", "FUND", "SPV", "ANGEL_GROUP"]),
        jurisdiction: z.string().default("DE"),
        address: addressSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return InvestorController.create({ ctx, input, db: ctx.db });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return InvestorController.list({ ctx, db: ctx.db });
  }),

  get: protectedProcedure
    .input(z.object({ investorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return InvestorController.get({ input, db: ctx.db });
    }),

  portfolio: investorMemberProcedure
    .input(z.object({ investorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return InvestorController.portfolio({ input, db: ctx.db });
    }),
});
