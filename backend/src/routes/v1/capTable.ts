import { z } from "zod";
import { createTRPCRouter } from "../../trpc";
import { companyMemberProcedure } from "../../middlewares/role.middleware";
import { CapTableController } from "../../controllers/capTable.controller";

export const capTableRouter = createTRPCRouter({
  list: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return CapTableController.list({ input, db: ctx.db });
    }),

  addEntry: companyMemberProcedure
    .input(
      z.object({
        companyId: z.string(),
        holderName: z.string(),
        holderEmail: z.string().email().optional(),
        securityType: z.enum([
          "COMMON",
          "PREFERRED_SEED",
          "PREFERRED_A",
          "SAFE",
          "NOTE",
          "OPTION",
          "WARRANT",
        ]),
        shareCount: z.bigint().optional(),
        pricePerShare: z.string().optional(),
        issueDate: z.date(),
        certificateNum: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CapTableController.addEntry({ ctx, input, db: ctx.db });
    }),

  summary: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return CapTableController.summary({ input, db: ctx.db });
    }),
});
