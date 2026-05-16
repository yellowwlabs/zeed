import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { CompanyController } from "../../controllers/company.controller";
import { companyMemberProcedure } from "../../middlewares/role.middleware";

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
      return CompanyController.create({ ctx, input, db: ctx.db });
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return CompanyController.list({ ctx, db: ctx.db });
  }),

  get: protectedProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return CompanyController.get({ input, db: ctx.db });
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
      return CompanyController.inviteMember({ input, db: ctx.db });
    }),
});
