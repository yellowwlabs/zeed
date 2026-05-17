"use client";

// Circuit logic mirrors founder_majority.compact — validated server-side too.

export function validateFounderMajorityClaim(
  founderShares: bigint,
  totalDilutedShares: bigint,
  thresholdBps: bigint,
): void {
  if (totalDilutedShares === 0n) {
    throw new Error("Total shares must be positive");
  }
  if (founderShares > totalDilutedShares) {
    throw new Error("Founders cannot exceed total shares");
  }
  if (founderShares * 10_000n < thresholdBps * totalDilutedShares) {
    throw new Error("Founders below threshold");
  }
}

export function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(2) + "%";
}
