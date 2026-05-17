import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const walletRouter = createTRPCRouter({
  connect: protectedProcedure
    .input(
      z.object({
        networkId: z.string(),
        encryptionPublicKey: z.string(),
        coinPublicKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.walletConnection.findUnique({
        where: { encryptionPublicKey: input.encryptionPublicKey },
      });

      if (existing && existing.userId !== userId) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This wallet is already connected to another account",
        });
      }

      return ctx.db.walletConnection.upsert({
        where: { userId },
        create: {
          userId,
          networkId: input.networkId,
          encryptionPublicKey: input.encryptionPublicKey,
          coinPublicKey: input.coinPublicKey,
        },
        update: {
          networkId: input.networkId,
          encryptionPublicKey: input.encryptionPublicKey,
          coinPublicKey: input.coinPublicKey,
        },
      });
    }),

  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.walletConnection.deleteMany({
      where: { userId: ctx.session.user.id },
    });
    return { success: true };
  }),

  getMine: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.walletConnection.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),
});
