// src/server/api/routers/deal.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, companyMemberProcedure } from "../trpc";

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
      // Validate at least one of cap/discount is set for SAFE rounds
      if (input.dealType === "SAFE_ROUND") {
        const terms = input.defaultTerms as z.infer<typeof safeDefaultsSchema>;
        if (!terms.valuationCap && !terms.discountRate && !terms.mfnEnabled) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "SAFE must have at least one of: valuation cap, discount, or MFN",
          });
        }
      }

      const deal = await ctx.db.deal.create({
        data: {
          companyId: input.companyId,
          name: input.name,
          dealType: input.dealType,
          status: "DRAFT",
          targetAmount: input.targetAmount,
          minimumAmount: input.minimumAmount,
          closingDeadline: input.closingDeadline,
          defaultTerms: input.defaultTerms,
          createdById: ctx.session.user.id,
        },
      });

      await ctx.db.auditEvent.create({
        data: {
          userId: ctx.session.user.id,
          eventType: "DEAL_CREATED",
          resourceType: "Deal",
          resourceId: deal.id,
          metadata: { dealType: deal.dealType, targetAmount: input.targetAmount },
        },
      });

      return deal;
    }),

  listForCompany: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.deal.findMany({
        where: { companyId: input.companyId },
        include: {
          _count: { select: { investments: true } },
          investments: { select: { amount: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  get: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.db.deal.findUniqueOrThrow({
        where: { id: input.dealId },
        include: {
          company: true,
          investments: { include: { investor: true } },
          documents: { select: { id: true, title: true, status: true } },
        },
      });

      // Auth check: must be company member OR an invited investor
      const isCompanyMember = await ctx.db.companyMember.findUnique({
        where: {
          userId_companyId: { userId: ctx.session.user.id, companyId: deal.companyId },
        },
      });

      const investorInDeal = await ctx.db.investorMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          investor: { investments: { some: { dealId: deal.id } } },
        },
      });

      if (!isCompanyMember && !investorInDeal) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return deal;
    }),

  openForInvestment: companyMemberProcedure
    .input(z.object({ dealId: z.string(), companyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.deal.update({
        where: { id: input.dealId },
        data: { status: "OPEN" },
      });
    }),
});
