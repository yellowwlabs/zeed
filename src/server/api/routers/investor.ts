import { z } from "zod";
import { createTRPCRouter, protectedProcedure, investorMemberProcedure } from "../trpc";

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
      const investor = await ctx.db.investor.create({
        data: {
          ...input,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "PARTNER",
            },
          },
        },
      });

      await ctx.db.auditEvent.create({
        data: {
          userId: ctx.session.user.id,
          eventType: "INVESTOR_CREATED",
          resourceType: "Investor",
          resourceId: investor.id,
          metadata: { entityName: investor.entityName },
        },
      });

      return investor;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.investor.findMany({
      where: { members: { some: { userId: ctx.session.user.id } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: investorMemberProcedure
    .input(z.object({ investorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.investor.findUniqueOrThrow({
        where: { id: input.investorId },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { investments: true } },
        },
      });
    }),

  portfolio: investorMemberProcedure
    .input(z.object({ investorId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.investment.findMany({
        where: { investorId: input.investorId },
        include: {
          deal: { include: { company: { select: { legalName: true } } } },
          conversionEvents: true,
        },
        orderBy: { invitedAt: "desc" },
      });
    }),
});
