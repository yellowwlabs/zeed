import { InvestorService } from "../services/investor.service";
import { PrismaClient } from "@prisma/client";

export class InvestorController {
  static async create({
    ctx,
    input,
    db,
  }: {
    ctx: any;
    input: any;
    db: PrismaClient;
  }) {
    const service = new InvestorService(db);
    return service.createInvestor(ctx.session.user.id, input);
  }

  static async list({
    ctx,
    db,
  }: {
    ctx: any;
    db: PrismaClient;
  }) {
    const service = new InvestorService(db);
    return service.listInvestors(ctx.session.user.id);
  }

  static async get({
    input,
    db,
  }: {
    input: any;
    db: PrismaClient;
  }) {
    const service = new InvestorService(db);
    return service.getInvestor(input.investorId);
  }

  static async portfolio({
    input,
    db,
  }: {
    input: any;
    db: PrismaClient;
  }) {
    const service = new InvestorService(db);
    return service.getPortfolio(input.investorId);
  }
}
