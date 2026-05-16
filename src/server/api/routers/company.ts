import { z } from "zod";
import { createTRPCRouter, protectedProcedure, companyMemberProcedure } from "../trpc";

const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  country: z.string().default("USA"),
});

export const companyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        legalName: z.string().min(1).max(200),
        dba: z.string().optional(),
        stateOfIncorp: z.string().default("DE"),
        entityType: z.string().default("C-Corp"),
        ein: z.string().optional(),
        formationDate: z.date().optional(),
        primaryAddress: addressSchema,
        authorizedShares: z.bigint().optional(),
        parValue: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await ctx.db.company.create({
        data: {
          ...input,
          parValue: input.parValue ? input.parValue : null,
          members: {
            create: {
              userId: ctx.session.user.id,
              role: "FOUNDER",
              isPrimary: true,
            },
          },
        },
      });

      await ctx.db.auditEvent.create({
        data: {
          userId: ctx.session.user.id,
          eventType: "COMPANY_CREATED",
          resourceType: "Company",
          resourceId: company.id,
          metadata: { legalName: company.legalName },
        },
      });

      return company;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.company.findMany({
      where: { members: { some: { userId: ctx.session.user.id } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.company.findUniqueOrThrow({
        where: { id: input.companyId },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { deals: true, capTableEntries: true } },
        },
      });
    }),

  inviteMember: companyMemberProcedure
    .input(
      z.object({
        companyId: z.string(),
        email: z.string().email(),
        role: z.enum(["FOUNDER", "CEO", "CFO", "ADMIN", "BOARD"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find or create user shell (they'll need to set password on first sign-in)
      let user = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (!user) {
        user = await ctx.db.user.create({
          data: { email: input.email, name: input.email.split("@")[0]! },
        });
      }

      const member = await ctx.db.companyMember.upsert({
        where: { userId_companyId: { userId: user.id, companyId: input.companyId } },
        create: { userId: user.id, companyId: input.companyId, role: input.role },
        update: { role: input.role },
      });

      // TODO: send invitation email
      return member;
    }),
});
