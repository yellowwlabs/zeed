import { PrismaClient } from "@prisma/client";

export class InvestmentService {
  constructor(private db: PrismaClient) {}

  async getDealById(dealId: string) {
    return this.db.deal.findUniqueOrThrow({
      where: { id: dealId },
    });
  }

  async isCompanyMember(userId: string, companyId: string) {
    return this.db.companyMember.findUnique({
      where: {
        userId_companyId: { userId, companyId },
      },
    });
  }

  async createInvestment(userId: string, input: any, instrumentType: string, defaultTerms: any) {
    const investment = await this.db.investment.create({
      data: {
        dealId: input.dealId,
        investorId: input.investorId,
        instrumentType: instrumentType as any,
        amount: input.amount,
        status: "INVITED",
        terms: (input.customTerms ?? defaultTerms) as any,
      },
    });

    await this.db.auditEvent.create({
      data: {
        userId: userId,
        eventType: "INVESTOR_INVITED",
        resourceType: "Investment",
        resourceId: investment.id,
        metadata: { dealId: input.dealId, amount: input.amount },
      },
    });

    return investment;
  }

  async getInvestmentWithMembers(investmentId: string) {
    return this.db.investment.findUniqueOrThrow({
      where: { id: investmentId },
      include: { investor: { include: { members: true } } },
    });
  }

  async updateInvestmentStatus(investmentId: string, status: string, agreedAt?: Date) {
    return this.db.investment.update({
      where: { id: investmentId },
      data: { 
        status: status as any,
        ...(agreedAt ? { agreedAt } : {}),
      },
    });
  }
}
