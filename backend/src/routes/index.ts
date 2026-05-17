import { createTRPCRouter } from "../trpc";
import { authRouter } from "./v1/auth";
import { capTableRouter } from "./v1/capTable";
import { companyRouter } from "./v1/company";
import { dealRouter } from "./v1/deal";
import { investmentRouter } from "./v1/investment";
import { investorRouter } from "./v1/investor";
import { walletRouter } from "./v1/wallet";
import { accreditationRouter } from "./v1/accreditation";
import { founderMajorityRouter } from "./v1/founder-majority";
import { bannerRouter } from "./v1/banner";
import { adminRouter } from "./v1/admin";

export const router = createTRPCRouter({
  auth: authRouter,
  company: companyRouter,
  investor: investorRouter,
  deal: dealRouter,
  investment: investmentRouter,
  capTable: capTableRouter,
  wallet: walletRouter,
  accreditation: accreditationRouter,
  founderMajority: founderMajorityRouter,
  banner: bannerRouter,
  admin: adminRouter,
});
