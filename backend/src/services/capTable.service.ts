import { PrismaClient } from "@prisma/client";

export class CapTableService {
  constructor(private db: PrismaClient) {}

  async listEntries(companyId: string) {
    return this.db.capTableEntry.findMany({
      where: { companyId },
      include: { vestingSchedule: true },
      orderBy: { issueDate: "asc" },
    });
  }

  async addEntry(input: any) {
    return this.db.capTableEntry.create({ data: input });
  }

  async createAuditEvent(data: {
    userId: string;
    eventType: string;
    resourceType: string;
    resourceId: string;
    metadata: any;
  }) {
    return this.db.auditEvent.create({ data });
  }

  async getEntries(companyId: string) {
    return this.db.capTableEntry.findMany({
      where: { companyId },
    });
  }
}
