import { CompanyService } from "../services/company.service";
import { PrismaClient } from "@prisma/client";

export class CompanyController {
  static async create({ ctx, input, db }: { ctx: any; input: any; db: PrismaClient }) {
    const service = new CompanyService(db);
    return service.createCompany(ctx.session.user.id, input);
  }

  static async list({ ctx, db }: { ctx: any; db: PrismaClient }) {
    const service = new CompanyService(db);
    return service.listCompaniesForUser(ctx.session.user.id);
  }

  static async get({ input, db }: { input: any; db: PrismaClient }) {
    const service = new CompanyService(db);
    return service.getCompanyWithDetails(input.companyId);
  }

  static async inviteMember({ input, db }: { input: any; db: PrismaClient }) {
    const service = new CompanyService(db);
    let user = await service.findUserByEmail(input.email);
    if (!user) {
      user = await service.createUserShell(input.email);
    }

    return service.upsertCompanyMember(user.id, input.companyId, input.role);
  }
}
