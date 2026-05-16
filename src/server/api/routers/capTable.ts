import { z } from "zod";
import { createTRPCRouter, companyMemberProcedure } from "../trpc";

export const capTableRouter = createTRPCRouter({
  list: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.capTableEntry.findMany({
        where: { companyId: input.companyId },
        include: { vestingSchedule: true },
        orderBy: { issueDate: "asc" },
      });
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
      const entry = await ctx.db.capTableEntry.create({ data: input });

      await ctx.db.auditEvent.create({
        data: {
          userId: ctx.session.user.id,
          eventType: "CAP_TABLE_ENTRY_ADDED",
          resourceType: "CapTableEntry",
          resourceId: entry.id,
          metadata: {
            securityType: entry.securityType,
            shareCount: entry.shareCount?.toString(),
          },
        },
      });

      return entry;
    }),

  summary: companyMemberProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const entries = await ctx.db.capTableEntry.findMany({
        where: { companyId: input.companyId },
      });

      const byType: Record<string, { count: number; shares: bigint }> = {};
      let totalShares = 0n;

      for (const e of entries) {
        if (!byType[e.securityType]) {
          byType[e.securityType] = { count: 0, shares: 0n };
        }
        byType[e.securityType]!.count += 1;
        if (e.shareCount) {
          byType[e.securityType]!.shares += e.shareCount;
          totalShares += e.shareCount;
        }
      }

      return { byType, totalShares: totalShares.toString(), totalHolders: entries.length };
    }),
});
