import { describe, it, expect } from "vitest";
import {
  convertPostMoneySafe,
  calculateNoteAccrual,
  convertNote,
  calculatePricePerShare,
  calculateDilution,
} from "./conversion";

describe("convertPostMoneySafe", () => {
  it("uses cap price when cap is lower than financing price", () => {
    const result = convertPostMoneySafe(
      {
        type: "POST_MONEY_VALUATION_CAP",
        purchaseAmount: "100000",
        valuationCap: "5000000",
        mfnEnabled: false,
        proRataEnabled: false,
      },
      {
        pricePerShare: "1.00",
        companyCapitalization: "10000000", // 10M shares
      }
    );

    // Cap price = 5M / 10M = $0.50
    // 100k / 0.50 = 200,000 shares
    expect(result.appliedMechanism).toBe("CAP");
    expect(result.conversionPrice).toBe("0.5000000000");
    expect(result.sharesIssued).toBe("200000");
  });

  it("uses discount when no cap and discount applies", () => {
    const result = convertPostMoneySafe(
      {
        type: "POST_MONEY_DISCOUNT",
        purchaseAmount: "50000",
        discountRate: 20,
        mfnEnabled: false,
        proRataEnabled: false,
      },
      {
        pricePerShare: "2.00",
        companyCapitalization: "10000000",
      }
    );

    // Discount: 2.00 * 0.80 = 1.60
    // 50k / 1.60 = 31,250
    expect(result.appliedMechanism).toBe("DISCOUNT");
    expect(result.conversionPrice).toBe("1.6000000000");
    expect(result.sharesIssued).toBe("31250");
  });

  it("picks the lower of cap and discount when both apply", () => {
    const result = convertPostMoneySafe(
      {
        type: "POST_MONEY_CAP_AND_DISCOUNT",
        purchaseAmount: "100000",
        valuationCap: "8000000",
        discountRate: 20,
        mfnEnabled: false,
        proRataEnabled: false,
      },
      {
        pricePerShare: "1.00",
        companyCapitalization: "10000000",
      }
    );

    // Cap: 8M/10M = 0.80
    // Discount: 1.00 * 0.80 = 0.80
    // Financing: 1.00
    // Tie between cap and discount at 0.80; either is correct
    expect(result.conversionPrice).toBe("0.8000000000");
    expect(result.sharesIssued).toBe("125000");
  });

  it("uses financing price when neither cap nor discount is favorable", () => {
    const result = convertPostMoneySafe(
      {
        type: "POST_MONEY_VALUATION_CAP",
        purchaseAmount: "100000",
        valuationCap: "100000000", // very high cap
        mfnEnabled: false,
        proRataEnabled: false,
      },
      {
        pricePerShare: "1.00",
        companyCapitalization: "10000000",
      }
    );

    // Cap: 100M / 10M = 10.00 (worse than financing)
    // Financing: 1.00
    expect(result.appliedMechanism).toBe("FINANCING_PRICE");
    expect(result.conversionPrice).toBe("1.0000000000");
  });

  it("rejects zero or negative purchase amounts", () => {
    expect(() =>
      convertPostMoneySafe(
        { type: "POST_MONEY_VALUATION_CAP", purchaseAmount: "0", valuationCap: "1000000", mfnEnabled: false, proRataEnabled: false },
        { pricePerShare: "1", companyCapitalization: "1000000" }
      )
    ).toThrow();
  });
});

describe("calculateNoteAccrual", () => {
  it("computes simple interest over 1 year", () => {
    const result = calculateNoteAccrual(
      "100000",
      8,
      new Date("2025-01-01"),
      new Date("2026-01-01")
    );

    // 100k * 0.08 * 1 = 8,000
    expect(result.interest).toBe("8000.00");
    expect(result.total).toBe("108000.00");
    expect(result.daysElapsed).toBe(365);
  });

  it("computes prorated interest over partial period", () => {
    const result = calculateNoteAccrual(
      "100000",
      6,
      new Date("2025-01-01"),
      new Date("2025-07-02") // 182 days
    );

    // 100k * 0.06 * (182/365) ≈ 2,991.78
    expect(parseFloat(result.interest)).toBeCloseTo(2991.78, 1);
  });

  it("throws when asOfDate is before issueDate", () => {
    expect(() =>
      calculateNoteAccrual("100000", 5, new Date("2026-01-01"), new Date("2025-01-01"))
    ).toThrow();
  });
});

describe("convertNote", () => {
  it("converts on principal plus accrued interest", () => {
    const result = convertNote(
      {
        principal: "100000",
        interestRate: 8,
        maturityDate: "2027-01-01",
        valuationCap: "5000000",
        qualifiedFinancingMin: "1000000",
        maturityTreatment: "CONVERT_AT_CAP",
      },
      new Date("2025-01-01"),
      new Date("2026-01-01"),
      {
        pricePerShare: "1.00",
        companyCapitalization: "10000000",
      }
    );

    // After 1 year: 108,000 owed
    // Cap price: 5M / 10M = 0.50
    // 108,000 / 0.50 = 216,000 shares
    expect(result.appliedMechanism).toBe("CAP");
    expect(result.sharesIssued).toBe("216000");
  });
});

describe("calculatePricePerShare", () => {
  it("computes pre-money price per share", () => {
    const price = calculatePricePerShare("10000000", "5000000");
    expect(price).toBe("2.0000000000");
  });
});

describe("calculateDilution", () => {
  it("computes investor ownership and post-money", () => {
    const result = calculateDilution({
      preMoneyValuation: "8000000",
      investmentAmount: "2000000",
      optionPoolPostMoneyPercent: 10,
    });

    expect(result.postMoneyValuation).toBe("10000000.00");
    expect(result.investorOwnershipPercent).toBe("20.0000");
    expect(result.optionPoolPercent).toBe("10.0000");
    expect(result.existingDilutionPercent).toBe("70.0000");
  });
});
