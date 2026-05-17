import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { adminProcedure } from "../../middlewares/role.middleware";

export const bannerRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.banner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.banner.findMany({
      orderBy: { order: "asc" },
      include: { createdBy: { select: { name: true, email: true } } },
    });
  }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        subtitle: z.string().optional(),
        imageUrl: z.string().url().optional(),
        ctaText: z.string().optional(),
        ctaUrl: z.string().url().optional(),
        isActive: z.boolean().default(true),
        order: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.banner.create({
        data: {
          ...input,
          createdById: ctx.session.user.id,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        subtitle: z.string().optional(),
        imageUrl: z.string().url().optional(),
        ctaText: z.string().optional(),
        ctaUrl: z.string().url().optional(),
        isActive: z.boolean().optional(),
        order: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.banner.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.banner.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
