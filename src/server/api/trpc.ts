// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z, ZodError } from "zod";

/**
 * Context that's created for every tRPC request.
 * Contains the session (if authenticated), Prisma client, and request info.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    session,
    db,
    headers: opts.headers,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public procedure — no auth required.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure — must be signed in.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Company-member procedure — must be a member of the specified company.
 * Input must include a `companyId` field.
 */

// export const companyMemberProcedure = protectedProcedure.use(async ({ ctx, input, next }) => {
//   const companyId = (input as unknown as Record<string, any>)?.companyId;
//   if (!companyId) {
//     throw new TRPCError({ code: "BAD_REQUEST", message: "companyId required" });
//   }

//   const membership = await ctx.db.companyMember.findUnique({
//     where: { userId_companyId: { userId: ctx.session.user.id, companyId } },
//   });

//   if (!membership) {
//     throw new TRPCError({ code: "FORBIDDEN", message: "Not a company member" });
//   }

//   return next({ ctx: { ...ctx, membership } });
// });
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
/**
 * Investor-member procedure — must be a member of the specified investor entity.
 */
export const investorMemberProcedure = protectedProcedure.use(async ({ ctx, input, next }) => {
  const investorId = (input as { investorId?: string })?.investorId;
  if (!investorId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "investorId required" });
  }

  const membership = await ctx.db.investorMember.findUnique({
    where: { userId_investorId: { userId: ctx.session.user.id, investorId } },
  });

  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not an investor member" });
  }

  return next({ ctx: { ...ctx, membership } });
});
