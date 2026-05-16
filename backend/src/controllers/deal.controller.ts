import { DealService } from "../services/deal.service";
import { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export class DealController {
  static async create({ ctx, input, db }: { ctx: any; input: any; db: PrismaClient }) {
    // Validate at least one of cap/discount is set for SAFE rounds
    if (input.dealType === "SAFE_ROUND") {
      const terms = input.defaultTerms;
      if (!terms.valuationCap && !terms.discountRate && !terms.mfnEnabled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "SAFE must have at least one of: valuation cap, discount, or MFN",
        });
      }
    }

    const service = new DealService(db);
    return service.createDeal(ctx.session.user.id, input);
  }

  static async listForCompany({ input, db }: { input: any; db: PrismaClient }) {
    const service = new DealService(db);
    return service.listDealsForCompany(input.companyId);
  }

  static async get({ ctx, input, db }: { ctx: any; input: any; db: PrismaClient }) {
    const service = new DealService(db);
    const deal = await service.getDealById(input.dealId);

    // Auth check: must be company member OR an invited investor
    const isCompanyMember = await service.isCompanyMember(ctx.session.user.id, deal.companyId);
    const investorInDeal = await service.findInvestorMemberForDeal(ctx.session.user.id, deal.id);

    if (!isCompanyMember && !investorInDeal) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return deal;
  }

  static async openForInvestment({ input, db }: { input: any; db: PrismaClient }) {
    const service = new DealService(db);
    return service.updateDealStatus(input.dealId, "OPEN");
  }
}
