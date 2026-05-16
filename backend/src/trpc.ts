import { initTRPC, TRPCError } from "@trpc/server";
import { type Request, type Response } from "express";
import superjson from "superjson";
import { auth } from "./lib/auth";
import { db } from "./lib/db";
import { ZodError } from "zod";

/**
 * Context that's created for every tRPC request.
 */
export const createTRPCContext = async (opts: { req: Request; res: Response }) => {
  let session = null;
  try {
    // @ts-ignore
    session = await auth(opts.req);
  } catch (e) {
    console.error("Auth session retrieval failed:", e);
  }

  return {
    session,
    db,
    req: opts.req,
    res: opts.res,
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
export const publicProcedure = t.procedure;

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
