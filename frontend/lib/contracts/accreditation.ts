"use client";

// Circuit logic mirrors accreditation.compact — validated server-side too.
// Call these to submit proofs; the backend re-validates and persists.

export const ACCREDITATION_THRESHOLDS = {
  INCOME_CENTS: 20_000_000n, // $200,000
  NET_WORTH_CENTS: 100_000_000n, // $1,000,000
  VALIDITY_MS: 90 * 24 * 60 * 60 * 1000, // 90 days
} as const;

export type AccreditationKind = "none" | "by_income" | "by_net_worth" | "by_entity_status";

export function validateIncomeClaim(annualIncomeCents: bigint): void {
  if (annualIncomeCents < ACCREDITATION_THRESHOLDS.INCOME_CENTS) {
    throw new Error("Income below $200k threshold");
  }
}

export function validateNetWorthClaim(netWorthCents: bigint): void {
  if (netWorthCents < ACCREDITATION_THRESHOLDS.NET_WORTH_CENTS) {
    throw new Error("Net worth below $1M threshold");
  }
}

export function isProofStillValid(proof: {
  proofType: string;
  expiresAt: Date | string;
}): boolean {
  if (!proof || proof.proofType === "none") return false;
  return new Date(proof.expiresAt) > new Date();
}
