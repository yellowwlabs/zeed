import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { companyMemberProcedure } from "../../middlewares/role.middleware";
import { DealController } from "../../controllers/deal.controller";

const safeDefaultsSchema = z.object({
  valuationCap: z.string().optional(),
  discountRate: z.number().min(0).max(100).optional(),
  mfnEnabled: z.boolean().default(false),
  proRataEnabled: z.boolean().default(false),
  governingLaw: z.string().default("Delaware"),
});

const noteDefaultsSchema = z.object({
  interestRate: z.number().min(0).max(20),
  maturityMonths: z.number().int().min(1).max(60).default(24),
  valuationCap: z.string().optional(),
  discountRate: z.number().min(0).max(100).optional(),
  qualifiedFinancingMin: z.string(),
  maturityTreatment: z.enum(["CONVERT_AT_CAP", "REPAY", "NEGOTIATE"]).default("NEGOTIATE"),
  governingLaw: z.string().default("Delaware"),
});

export const dealRouter = createTRPCRouter({
  create: companyMemberProcedure
    .input(
      z.object({
        companyId: z.string(),
        name: z.string().min(1).max(120),
        dealType: z.enum(["SAFE_ROUND", "NOTE_ROUND"]),
        targetAmount: z.string(),
        minimumAmount: z.string().optional(),
        closingDeadline: z.date().optional(),
        defaultTerms: z.union([safeDefaultsSchema, noteDefaultsSchema]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return DealController.create({ ctx, input, db: ctx.db });
    }),

  listForCompany: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return DealController.listForCompany({ input, db: ctx.db });
    }),

  get: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      return DealController.get({ ctx, input, db: ctx.db });
    }),

  openForInvestment: companyMemberProcedure
    .input(z.object({ dealId: z.string(), companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return DealController.openForInvestment({ input, db: ctx.db });
    }),
});
