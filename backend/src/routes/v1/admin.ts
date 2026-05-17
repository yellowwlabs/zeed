import { z } from "zod";
import { createTRPCRouter } from "../../trpc";
import { adminProcedure } from "../../middlewares/role.middleware";

export const adminRouter = createTRPCRouter({
  listUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      });
    }),
});
