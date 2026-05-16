import { createTRPCRouter } from "../trpc";
import { authRouter } from "./v1/auth";
import { capTableRouter } from "./v1/capTable";
import { companyRouter } from "./v1/company";
import { dealRouter } from "./v1/deal";
import { investmentRouter } from "./v1/investment";
import { investorRouter } from "./v1/investor";

export const router = createTRPCRouter({
    auth: authRouter,
    company: companyRouter,
    investor: investorRouter,
    deal: dealRouter,
    investment: investmentRouter,
    capTable: capTableRouter,
})