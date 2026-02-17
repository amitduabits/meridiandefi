// ---------------------------------------------------------------------------
// tRPC initialisation — shared `t` object used by all routers.
// ---------------------------------------------------------------------------

import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

// ---------------------------------------------------------------------------
// Reusable building blocks
// ---------------------------------------------------------------------------

export const router = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;

/**
 * Authenticated procedure — requires a valid SIWE session.
 */
export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.address) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sign in with Ethereum to access this resource.",
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      address: ctx.address,
    },
  });
});
