import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../../trpc";
import { AuthController } from "../../controllers/auth.controller";

export const authRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string().min(1).max(120),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AuthController.signUp({ input, db: ctx.db });
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return AuthController.me({ ctx, db: ctx.db });
  }),
});
