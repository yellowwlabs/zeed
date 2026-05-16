import { createTRPCRouter } from "./trpc";
import { authRouter } from "./routes/v1/auth";
import { companyRouter } from "./routes/v1/company";
import { investorRouter } from "./routes/v1/investor";
import { dealRouter } from "./routes/v1/deal";
import { investmentRouter } from "./routes/v1/investment";
import { capTableRouter } from "./routes/v1/capTable";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  company: companyRouter,
  investor: investorRouter,
  deal: dealRouter,
  investment: investmentRouter,
  capTable: capTableRouter,
});

export type AppRouter = typeof appRouter;
