import { PrismaClient } from "@prisma/client";

export class DealService {
  constructor(private db: PrismaClient) {}

  async createDeal(userId: string, input: any) {
    const deal = await this.db.deal.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        dealType: input.dealType,
        status: "DRAFT",
        targetAmount: input.targetAmount,
        minimumAmount: input.minimumAmount,
        closingDeadline: input.closingDeadline,
        defaultTerms: input.defaultTerms,
        createdById: userId,
      },
    });

    await this.db.auditEvent.create({
      data: {
        userId: userId,
        eventType: "DEAL_CREATED",
        resourceType: "Deal",
        resourceId: deal.id,
        metadata: { dealType: deal.dealType, targetAmount: input.targetAmount },
      },
    });

    return deal;
  }

  async listDealsForCompany(companyId: string) {
    return this.db.deal.findMany({
      where: { companyId },
      include: {
        _count: { select: { investments: true } },
        investments: { select: { amount: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getDealById(dealId: string) {
    return this.db.deal.findUniqueOrThrow({
      where: { id: dealId },
      include: {
        company: true,
        investments: { include: { investor: true } },
        documents: { select: { id: true, title: true, status: true } },
        _count: { select: { investments: true } },
      },
    });
  }

  async isCompanyMember(userId: string, companyId: string) {
    return this.db.companyMember.findUnique({
      where: {
        userId_companyId: { userId, companyId },
      },
    });
  }

  async findInvestorMemberForDeal(userId: string, dealId: string) {
    return this.db.investorMember.findFirst({
      where: {
        userId,
        investor: { investments: { some: { dealId } } },
      },
    });
  }

  async updateDealStatus(dealId: string, status: string) {
    return this.db.deal.update({
      where: { id: dealId },
      data: { status: status as any },
    });
  }
}
