/**
 * Tests for accreditation.compact circuit logic.
 *
 * Simulates Compact circuits in TypeScript — runs without a Midnight node.
 * Amounts are in cents (Uint<64> on-chain). Validity window is 90 days (7_776_000 s).
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Types mirroring Compact ledger / witnesses
// ---------------------------------------------------------------------------

enum AccreditationKind {
  none = "none",
  by_income = "by_income",
  by_net_worth = "by_net_worth",
  by_entity_status = "by_entity_status",
}

type LedgerState = {
  kind: AccreditationKind;
  verifiedAt: bigint;
  validitySeconds: bigint; // sealed — always 7_776_000n
};

// SEC thresholds in cents
const INCOME_THRESHOLD_CENTS = 20_000_000n; // $200,000
const NET_WORTH_THRESHOLD_CENTS = 100_000_000n; // $1,000,000
const VALIDITY_SECONDS = 7_776_000n; // 90 days

// ---------------------------------------------------------------------------
// Circuit simulations
// ---------------------------------------------------------------------------

function makeState(): LedgerState {
  return {
    kind: AccreditationKind.none,
    verifiedAt: 0n,
    validitySeconds: VALIDITY_SECONDS,
  };
}

function proveByIncome(
  state: LedgerState,
  witnesses: { annualIncomeCents: bigint; currentTimestamp: bigint },
): LedgerState {
  const { annualIncomeCents: income, currentTimestamp: ts } = witnesses;
  if (!(income >= INCOME_THRESHOLD_CENTS))
    throw new Error("income below $200k threshold");
  return { ...state, kind: AccreditationKind.by_income, verifiedAt: ts };
}

function proveByNetWorth(
  state: LedgerState,
  witnesses: { netWorthCents: bigint; currentTimestamp: bigint },
): LedgerState {
  const { netWorthCents: nw, currentTimestamp: ts } = witnesses;
  if (!(nw >= NET_WORTH_THRESHOLD_CENTS))
    throw new Error("net worth below $1M threshold");
  return { ...state, kind: AccreditationKind.by_net_worth, verifiedAt: ts };
}

function checkStillValid(
  state: LedgerState,
  witnesses: { currentTimestamp: bigint },
): boolean {
  const { currentTimestamp: now } = witnesses;
  const isValidKind = state.kind !== AccreditationKind.none;
  const expiresAt = state.verifiedAt + state.validitySeconds;
  const isWithinWindow = now <= expiresAt;
  return isValidKind && isWithinWindow;
}

function revoke(state: LedgerState): LedgerState {
  return { ...state, kind: AccreditationKind.none, verifiedAt: 0n };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000n; // arbitrary Unix timestamp
const EXPIRED_NOW = NOW + VALIDITY_SECONDS + 1n;

// ---------------------------------------------------------------------------
// prove_by_income()
// ---------------------------------------------------------------------------

describe("prove_by_income()", () => {
  it("accepts income exactly at $200k threshold", () => {
    const next = proveByIncome(makeState(), {
      annualIncomeCents: 20_000_000n,
      currentTimestamp: NOW,
    });
    expect(next.kind).toBe(AccreditationKind.by_income);
    expect(next.verifiedAt).toBe(NOW);
  });

  it("accepts income above threshold", () => {
    const next = proveByIncome(makeState(), {
      annualIncomeCents: 50_000_000n, // $500k
      currentTimestamp: NOW,
    });
    expect(next.kind).toBe(AccreditationKind.by_income);
  });

  it("accepts joint income at $300k (above $200k individual threshold)", () => {
    const next = proveByIncome(makeState(), {
      annualIncomeCents: 30_000_000n,
      currentTimestamp: NOW,
    });
    expect(next.kind).toBe(AccreditationKind.by_income);
  });

  it("rejects income one cent below $200k", () => {
    expect(() =>
      proveByIncome(makeState(), {
        annualIncomeCents: 19_999_999n,
        currentTimestamp: NOW,
      }),
    ).toThrow("income below $200k threshold");
  });

  it("rejects zero income", () => {
    expect(() =>
      proveByIncome(makeState(), { annualIncomeCents: 0n, currentTimestamp: NOW }),
    ).toThrow("income below $200k threshold");
  });

  it("records the prover-supplied timestamp", () => {
    const ts = 1_750_000_000n;
    const next = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: ts,
    });
    expect(next.verifiedAt).toBe(ts);
  });

  it("does not mutate original state on failure", () => {
    const state = makeState();
    try {
      proveByIncome(state, { annualIncomeCents: 0n, currentTimestamp: NOW });
    } catch {
      // expected
    }
    expect(state.kind).toBe(AccreditationKind.none);
  });
});

// ---------------------------------------------------------------------------
// prove_by_net_worth()
// ---------------------------------------------------------------------------

describe("prove_by_net_worth()", () => {
  it("accepts net worth exactly at $1M threshold", () => {
    const next = proveByNetWorth(makeState(), {
      netWorthCents: 100_000_000n,
      currentTimestamp: NOW,
    });
    expect(next.kind).toBe(AccreditationKind.by_net_worth);
    expect(next.verifiedAt).toBe(NOW);
  });

  it("accepts net worth well above $1M", () => {
    const next = proveByNetWorth(makeState(), {
      netWorthCents: 500_000_000n, // $5M
      currentTimestamp: NOW,
    });
    expect(next.kind).toBe(AccreditationKind.by_net_worth);
  });

  it("rejects net worth one cent below $1M", () => {
    expect(() =>
      proveByNetWorth(makeState(), {
        netWorthCents: 99_999_999n,
        currentTimestamp: NOW,
      }),
    ).toThrow("net worth below $1M threshold");
  });

  it("rejects zero net worth", () => {
    expect(() =>
      proveByNetWorth(makeState(), { netWorthCents: 0n, currentTimestamp: NOW }),
    ).toThrow("net worth below $1M threshold");
  });
});

// ---------------------------------------------------------------------------
// check_still_valid()
// ---------------------------------------------------------------------------

describe("check_still_valid()", () => {
  it("returns false for a fresh (unproven) state", () => {
    expect(checkStillValid(makeState(), { currentTimestamp: NOW })).toBe(false);
  });

  it("returns true immediately after income proof", () => {
    const state = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    expect(checkStillValid(state, { currentTimestamp: NOW })).toBe(true);
  });

  it("returns true at the last second of the validity window", () => {
    const state = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    const lastSecond = NOW + VALIDITY_SECONDS;
    expect(checkStillValid(state, { currentTimestamp: lastSecond })).toBe(true);
  });

  it("returns false one second after the window expires", () => {
    const state = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    expect(checkStillValid(state, { currentTimestamp: EXPIRED_NOW })).toBe(false);
  });

  it("returns false after revocation even within window", () => {
    const proved = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    const revoked = revoke(proved);
    expect(checkStillValid(revoked, { currentTimestamp: NOW })).toBe(false);
  });

  it("returns true after net worth proof within window", () => {
    const state = proveByNetWorth(makeState(), {
      netWorthCents: 200_000_000n,
      currentTimestamp: NOW,
    });
    expect(checkStillValid(state, { currentTimestamp: NOW + 1_000n })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// revoke()
// ---------------------------------------------------------------------------

describe("revoke()", () => {
  it("resets kind to none", () => {
    const proved = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    expect(revoke(proved).kind).toBe(AccreditationKind.none);
  });

  it("resets verified_at to 0", () => {
    const proved = proveByNetWorth(makeState(), {
      netWorthCents: 200_000_000n,
      currentTimestamp: NOW,
    });
    expect(revoke(proved).verifiedAt).toBe(0n);
  });

  it("is idempotent — revoking twice is safe", () => {
    const state = revoke(revoke(makeState()));
    expect(state.kind).toBe(AccreditationKind.none);
    expect(state.verifiedAt).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// AccreditationKind state transitions
// ---------------------------------------------------------------------------

describe("AccreditationKind state transitions", () => {
  it("overwriting income proof with net worth proof changes kind", () => {
    const afterIncome = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    const afterNetWorth = proveByNetWorth(afterIncome, {
      netWorthCents: 200_000_000n,
      currentTimestamp: NOW + 1_000n,
    });
    expect(afterNetWorth.kind).toBe(AccreditationKind.by_net_worth);
  });

  it("kind is none initially — no proof is active", () => {
    expect(makeState().kind).toBe(AccreditationKind.none);
  });
});

// ---------------------------------------------------------------------------
// Validity window boundary precision
// ---------------------------------------------------------------------------

describe("90-day validity window", () => {
  it("VALIDITY_SECONDS is exactly 7,776,000 (90 × 86,400)", () => {
    expect(VALIDITY_SECONDS).toBe(90n * 86_400n);
  });

  it("proof remains valid halfway through the window", () => {
    const state = proveByIncome(makeState(), {
      annualIncomeCents: 25_000_000n,
      currentTimestamp: NOW,
    });
    const halfway = NOW + VALIDITY_SECONDS / 2n;
    expect(checkStillValid(state, { currentTimestamp: halfway })).toBe(true);
  });
});
