import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routers/auth";
import { companyRouter } from "./routers/company";
import { investorRouter } from "./routers/investor";
import { dealRouter } from "./routers/deal";
import { investmentRouter } from "./routers/investment";
import { capTableRouter } from "./routers/capTable";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  company: companyRouter,
  investor: investorRouter,
  deal: dealRouter,
  investment: investmentRouter,
  capTable: capTableRouter,
});

export type AppRouter = typeof appRouter;
