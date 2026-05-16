import { PrismaClient } from "@prisma/client";

export class InvestorService {
  constructor(private db: PrismaClient) {}

  async createInvestor(userId: string, input: any) {
    const investor = await this.db.investor.create({
      data: {
        ...input,
        members: {
          create: {
            userId: userId,
            role: "PARTNER",
          },
        },
      },
    });

    await this.db.auditEvent.create({
      data: {
        userId: userId,
        eventType: "INVESTOR_CREATED",
        resourceType: "Investor",
        resourceId: investor.id,
        metadata: { entityName: investor.entityName },
      },
    });

    return investor;
  }

  async listInvestors(userId: string) {
    return this.db.investor.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInvestor(investorId: string) {
    return this.db.investor.findUniqueOrThrow({
      where: { id: investorId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { investments: true } },
      },
    });
  }

  async getPortfolio(investorId: string) {
    return this.db.investment.findMany({
      where: { investorId },
      include: {
        deal: { include: { company: { select: { legalName: true } } } },
        conversionEvents: true,
      },
      orderBy: { invitedAt: "desc" },
    });
  }
}
