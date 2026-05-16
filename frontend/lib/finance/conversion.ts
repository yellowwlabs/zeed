import Decimal from "decimal.js";

// Configure Decimal for finance: 28 significant digits, round half-up
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type SafeType =
  | "POST_MONEY_VALUATION_CAP"
  | "POST_MONEY_DISCOUNT"
  | "POST_MONEY_CAP_AND_DISCOUNT"
  | "POST_MONEY_MFN_ONLY";

export interface SafeTerms {
  type: SafeType;
  purchaseAmount: string;
  valuationCap?: string;
  discountRate?: number;
  mfnEnabled: boolean;
  proRataEnabled: boolean;
}

export interface NoteTerms {
  principal: string;
  interestRate: number;
  maturityDate: string;
  valuationCap?: string;
  discountRate?: number;
  qualifiedFinancingMin: string;
  maturityTreatment: "CONVERT_AT_CAP" | "REPAY" | "NEGOTIATE";
  changeOfControlMultiplier?: number;
}

export interface EquityFinancing {
  pricePerShare: string;
  companyCapitalization: string;
}

export interface ConversionResult {
  conversionPrice: string;
  sharesIssued: string;
  appliedMechanism: "CAP" | "DISCOUNT" | "FINANCING_PRICE";
  amountConverted: string;
}

/**
 * Compute SAFE conversion at a qualifying equity financing.
 * Conversion price = MIN(financingPrice, discountPrice, capPrice)
 */
export function convertPostMoneySafe(
  terms: SafeTerms,
  financing: EquityFinancing
): ConversionResult {
  const purchaseAmount = new Decimal(terms.purchaseAmount);
  const financingPrice = new Decimal(financing.pricePerShare);
  const companyCap = new Decimal(financing.companyCapitalization);

  if (purchaseAmount.lte(0)) throw new Error("Purchase amount must be positive");
  if (financingPrice.lte(0)) throw new Error("Financing price must be positive");
  if (companyCap.lte(0)) throw new Error("Company capitalization must be positive");

  const candidates: Array<{ price: Decimal; mechanism: ConversionResult["appliedMechanism"] }> = [
    { price: financingPrice, mechanism: "FINANCING_PRICE" },
  ];

  if (terms.discountRate && terms.discountRate > 0) {
    if (terms.discountRate >= 100) throw new Error("Discount rate must be < 100");
    const discountPrice = financingPrice.mul(
      new Decimal(1).minus(new Decimal(terms.discountRate).div(100))
    );
    candidates.push({ price: discountPrice, mechanism: "DISCOUNT" });
  }

  if (terms.valuationCap) {
    const capPrice = new Decimal(terms.valuationCap).div(companyCap);
    candidates.push({ price: capPrice, mechanism: "CAP" });
  }

  const winner = candidates.reduce((a, b) => (a.price.lt(b.price) ? a : b));
  const shares = purchaseAmount.div(winner.price).floor();

  return {
    conversionPrice: winner.price.toFixed(10),
    sharesIssued: shares.toFixed(0),
    appliedMechanism: winner.mechanism,
    amountConverted: purchaseAmount.toFixed(2),
  };
}

/**
 * Compute interest accrual on a convertible note.
 * Simple interest, day-count convention: actual/365.
 */
export function calculateNoteAccrual(
  principal: string,
  interestRate: number,
  issueDate: Date,
  asOfDate: Date
): { interest: string; total: string; daysElapsed: number } {
  if (asOfDate < issueDate) throw new Error("asOfDate must be after issueDate");

  const principalD = new Decimal(principal);
  const days = Math.floor((asOfDate.getTime() - issueDate.getTime()) / (1000 * 60 * 60 * 24));
  const years = new Decimal(days).div(365);
  const interest = principalD.mul(new Decimal(interestRate).div(100)).mul(years);
  const total = principalD.plus(interest);

  return {
    interest: interest.toFixed(2),
    total: total.toFixed(2),
    daysElapsed: days,
  };
}

/**
 * Convert a note at a qualifying equity financing, including accrued interest.
 */
export function convertNote(
  terms: NoteTerms,
  issueDate: Date,
  conversionDate: Date,
  financing: EquityFinancing
): ConversionResult {
  const accrual = calculateNoteAccrual(
    terms.principal,
    terms.interestRate,
    issueDate,
    conversionDate
  );

  // Note converts on total (principal + interest) per standard form
  const safeEquivalent: SafeTerms = {
    type: "POST_MONEY_CAP_AND_DISCOUNT",
    purchaseAmount: accrual.total,
    valuationCap: terms.valuationCap,
    discountRate: terms.discountRate,
    mfnEnabled: false,
    proRataEnabled: false,
  };

  return convertPostMoneySafe(safeEquivalent, financing);
}

/**
 * Calculate the price per share for a new equity financing given pre-money valuation.
 */
export function calculatePricePerShare(
  preMoneyValuation: string,
  sharesOutstandingFullyDiluted: string
): string {
  return new Decimal(preMoneyValuation)
    .div(new Decimal(sharesOutstandingFullyDiluted))
    .toFixed(10);
}

/**
 * Compute dilution from a new round.
 */
export function calculateDilution(input: {
  preMoneyValuation: string;
  investmentAmount: string;
  optionPoolPostMoneyPercent?: number;
}): {
  postMoneyValuation: string;
  investorOwnershipPercent: string;
  optionPoolPercent: string;
  existingDilutionPercent: string;
} {
  const preMoney = new Decimal(input.preMoneyValuation);
  const investment = new Decimal(input.investmentAmount);
  const postMoney = preMoney.plus(investment);

  const investorOwn = investment.div(postMoney).mul(100);
  const optionPool = new Decimal(input.optionPoolPostMoneyPercent ?? 0);
  const existingDilution = new Decimal(100).minus(investorOwn).minus(optionPool);

  return {
    postMoneyValuation: postMoney.toFixed(2),
    investorOwnershipPercent: investorOwn.toFixed(4),
    optionPoolPercent: optionPool.toFixed(4),
    existingDilutionPercent: existingDilution.toFixed(4),
  };
}
