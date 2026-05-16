import { CapTableService } from "../services/capTable.service";
import { PrismaClient } from "@prisma/client";

export class CapTableController {
  static async list({ input, db }: { input: any; db: PrismaClient }) {
    const service = new CapTableService(db);
    return service.listEntries(input.companyId);
  }

  static async addEntry({ ctx, input, db }: { ctx: any; input: any; db: PrismaClient }) {
    const service = new CapTableService(db);
    const entry = await service.addEntry(input);

    await service.createAuditEvent({
      userId: ctx.session.user.id,
      eventType: "CAP_TABLE_ENTRY_ADDED",
      resourceType: "CapTableEntry",
      resourceId: entry.id,
      metadata: {
        securityType: entry.securityType,
        shareCount: entry.shareCount?.toString(),
      },
    });

    return entry;
  }

  static async summary({ input, db }: { input: any; db: PrismaClient }) {
    const service = new CapTableService(db);
    const entries = await service.getEntries(input.companyId);

    const byType: Record<string, { count: number; shares: bigint }> = {};
    let totalShares = 0n;

    for (const e of entries) {
      if (!byType[e.securityType]) {
        byType[e.securityType] = { count: 0, shares: 0n };
      }
      byType[e.securityType]!.count += 1;
      if (e.shareCount) {
        byType[e.securityType]!.shares += e.shareCount;
        totalShares += e.shareCount;
      }
    }

    return { 
      byType, 
      totalShares: totalShares.toString(), 
      totalHolders: entries.length 
    };
  }
}
