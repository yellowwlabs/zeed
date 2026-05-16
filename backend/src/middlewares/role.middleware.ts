import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../trpc";

export const companyMemberProcedure = protectedProcedure
  .input(z.object({ companyId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const membership = await ctx.db.companyMember.findUnique({
      where: {
        userId_companyId: {
          userId: ctx.session.user.id,
          companyId: input.companyId,
        },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not a company member",
      });
    }

    return next({
      ctx: {
        ...ctx,
        membership,
      },
    });
  });

export const investorMemberProcedure = protectedProcedure
  .input(z.object({ investorId: z.string() }))
  .use(async ({ ctx, input, next }) => {
    const membership = await ctx.db.investorMember.findUnique({
      where: {
        userId_investorId: {
          userId: ctx.session.user.id,
          investorId: input.investorId,
        },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Not an investor member",
      });
    }

    return next({
      ctx: {
        ...ctx,
        membership,
      },
    });
  });
