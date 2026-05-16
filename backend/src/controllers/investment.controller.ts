import { TRPCError } from "@trpc/server";
import { InvestmentService } from "../services/investment.service";
import { PrismaClient } from "@prisma/client";

export class InvestmentController {
  static async inviteInvestor({
    ctx,
    input,
    db,
  }: {
    ctx: any;
    input: any;
    db: PrismaClient;
  }) {
    const service = new InvestmentService(db);
    const deal = await service.getDealById(input.dealId);

    const membership = await service.isCompanyMember(ctx.session.user.id, deal.companyId);
    if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

    const instrumentType = deal.dealType === "SAFE_ROUND" ? "SAFE" : "CONVERTIBLE_NOTE";

    return service.createInvestment(
      ctx.session.user.id,
      input,
      instrumentType,
      deal.defaultTerms
    );
  }

  static async agreeToTerms({
    ctx,
    input,
    db,
  }: {
    ctx: any;
    input: any;
    db: PrismaClient;
  }) {
    const service = new InvestmentService(db);
    const investment = await service.getInvestmentWithMembers(input.investmentId);

    const isMember = investment.investor.members.some(
      (m: any) => m.userId === ctx.session.user.id
    );
    if (!isMember) throw new TRPCError({ code: "FORBIDDEN" });

    return service.updateInvestmentStatus(input.investmentId, "TERM_AGREED", new Date());
  }
}
