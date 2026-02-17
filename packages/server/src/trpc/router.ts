// ---------------------------------------------------------------------------
// Root tRPC router — merges all sub-routers.
// ---------------------------------------------------------------------------

import { router } from "./init.js";
import { agentsRouter } from "./agents.js";
import { portfolioRouter } from "./portfolio.js";
import { transactionsRouter } from "./transactions.js";
import { riskRouter } from "./risk.js";
import { systemRouter } from "./system.js";

// ---------------------------------------------------------------------------
// App router
// ---------------------------------------------------------------------------

export const appRouter = router({
  agents: agentsRouter,
  portfolio: portfolioRouter,
  transactions: transactionsRouter,
  risk: riskRouter,
  system: systemRouter,
});

/** Export the router type for client-side type inference. */
export type AppRouter = typeof appRouter;
