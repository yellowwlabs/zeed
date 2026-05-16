import { PrismaClient } from "@prisma/client";

export class CompanyService {
  constructor(private db: PrismaClient) {}

  async createCompany(userId: string, input: any) {
    const company = await this.db.company.create({
      data: {
        ...input,
        parValue: input.parValue ? input.parValue : null,
        members: {
          create: {
            userId: userId,
            role: "FOUNDER",
            isPrimary: true,
          },
        },
      },
    });

    await this.db.auditEvent.create({
      data: {
        userId: userId,
        eventType: "COMPANY_CREATED",
        resourceType: "Company",
        resourceId: company.id,
        metadata: { legalName: company.legalName },
      },
    });

    return company;
  }

  async listCompaniesForUser(userId: string) {
    return this.db.company.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCompanyById(companyId: string) {
    return this.db.company.findUniqueOrThrow({
      where: { id: companyId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { deals: true, capTableEntries: true } },
      },
    });
  }

  async findUserByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  async createUserShell(email: string) {
    return this.db.user.create({
      data: { email, name: email.split("@")[0]! },
    });
  }

  async upsertCompanyMember(userId: string, companyId: string, role: string) {
    return this.db.companyMember.upsert({
      where: { userId_companyId: { userId, companyId } },
      create: { userId, companyId, role: role as any },
      update: { role: role as any },
    });
  }
}
