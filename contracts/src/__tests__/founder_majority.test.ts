/**
 * Tests for founder_majority.compact circuit logic.
 *
 * Simulates the Compact circuit assertions in TypeScript so tests run without
 * a Midnight node or ZK prover. Each helper mirrors the on-chain arithmetic
 * exactly (bigint, basis-points scale of 10_000).
 *
 * When compiled artifacts land in managed/founder_majority/, add integration
 * tests that deploy and call the real circuits against a local node.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Circuit simulation helpers
// ---------------------------------------------------------------------------

type PublishProofWitnesses = {
  founderShares: bigint;
  totalDilutedShares: bigint;
};

type LedgerState = {
  lastProofValid: boolean;
  proofCount: bigint;
};

function makeState(): LedgerState {
  return { lastProofValid: false, proofCount: 0n };
}

/**
 * Mirrors the publish_proof() circuit.
 * Throws with the same assertion message Compact would use if constraints fail.
 */
function publishProof(
  state: LedgerState,
  proofThreshold: bigint,
  witnesses: PublishProofWitnesses,
): LedgerState {
  const { founderShares: founders, totalDilutedShares: total } = witnesses;

  if (!(total > 0n)) throw new Error("total_diluted_shares must be positive");
  if (!(founders <= total)) throw new Error("founders cannot exceed total shares");

  // founders * 10_000 >= threshold * total  (basis-points comparison)
  const lhs = founders * 10_000n;
  const rhs = proofThreshold * total;
  if (!(lhs >= rhs)) throw new Error("founders below threshold");

  return {
    lastProofValid: true,
    proofCount: state.proofCount + 1n,
  };
}

/** Mirrors is_currently_valid() — pure read of ledger state. */
function isCurrentlyValid(state: LedgerState): boolean {
  return state.lastProofValid;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const THRESHOLD_51_PCT = 5_100n; // 51.00% in basis points
const THRESHOLD_66_PCT = 6_600n; // 66.00%
const COMPANY_ID = new Uint8Array(32).fill(0xab);

// ---------------------------------------------------------------------------
// publish_proof() — happy paths
// ---------------------------------------------------------------------------

describe("publish_proof() – valid proofs", () => {
  it("accepts founders who hold exactly the threshold (51%)", () => {
    const state = makeState();
    const next = publishProof(state, THRESHOLD_51_PCT, {
      founderShares: 51n,
      totalDilutedShares: 100n,
    });
    expect(next.lastProofValid).toBe(true);
    expect(next.proofCount).toBe(1n);
  });

  it("accepts founders who hold more than the threshold", () => {
    const state = makeState();
    const next = publishProof(state, THRESHOLD_51_PCT, {
      founderShares: 80n,
      totalDilutedShares: 100n,
    });
    expect(next.lastProofValid).toBe(true);
  });

  it("accepts when founders hold 100% of shares", () => {
    const state = makeState();
    const next = publishProof(state, THRESHOLD_51_PCT, {
      founderShares: 1_000_000n,
      totalDilutedShares: 1_000_000n,
    });
    expect(next.lastProofValid).toBe(true);
  });

  it("increments proof_count on each successful call", () => {
    let state = makeState();
    state = publishProof(state, THRESHOLD_51_PCT, { founderShares: 6n, totalDilutedShares: 10n });
    state = publishProof(state, THRESHOLD_51_PCT, { founderShares: 7n, totalDilutedShares: 10n });
    expect(state.proofCount).toBe(2n);
  });

  it("handles large share counts without overflow (uses bigint arithmetic)", () => {
    const state = makeState();
    // Uint<64> max-ish: 10^18 shares, founders hold 60%
    const total = 1_000_000_000_000_000_000n;
    const founders = 600_000_000_000_000_000n;
    const next = publishProof(state, THRESHOLD_51_PCT, { founderShares: founders, totalDilutedShares: total });
    expect(next.lastProofValid).toBe(true);
  });

  it("passes a 2/3 supermajority threshold with exact shares", () => {
    const state = makeState();
    // 66.66% founders, threshold 66%
    const next = publishProof(state, THRESHOLD_66_PCT, {
      founderShares: 200n,
      totalDilutedShares: 300n,
    });
    expect(next.lastProofValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// publish_proof() — assertion failures
// ---------------------------------------------------------------------------

describe("publish_proof() – assertion failures", () => {
  it("rejects when founders are below threshold", () => {
    expect(() =>
      publishProof(makeState(), THRESHOLD_51_PCT, {
        founderShares: 50n,
        totalDilutedShares: 100n,
      }),
    ).toThrow("founders below threshold");
  });

  it("rejects when total shares is zero", () => {
    expect(() =>
      publishProof(makeState(), THRESHOLD_51_PCT, {
        founderShares: 0n,
        totalDilutedShares: 0n,
      }),
    ).toThrow("total_diluted_shares must be positive");
  });

  it("rejects when founders exceed total shares", () => {
    expect(() =>
      publishProof(makeState(), THRESHOLD_51_PCT, {
        founderShares: 101n,
        totalDilutedShares: 100n,
      }),
    ).toThrow("founders cannot exceed total shares");
  });

  it("rejects when founders hold exactly one basis point below threshold", () => {
    // threshold 51.00% — founders at 50.99%: 5099 * 100 = 509900, 5100 * 100 = 510000
    expect(() =>
      publishProof(makeState(), THRESHOLD_51_PCT, {
        founderShares: 5_099n,
        totalDilutedShares: 10_000n,
      }),
    ).toThrow("founders below threshold");
  });

  it("does not mutate state on failed proof", () => {
    const state = makeState();
    try {
      publishProof(state, THRESHOLD_51_PCT, { founderShares: 10n, totalDilutedShares: 100n });
    } catch {
      // expected
    }
    // Original state unchanged (publishProof returns new state, never mutates)
    expect(state.lastProofValid).toBe(false);
    expect(state.proofCount).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// is_currently_valid()
// ---------------------------------------------------------------------------

describe("is_currently_valid()", () => {
  it("returns false before any proof is published", () => {
    expect(isCurrentlyValid(makeState())).toBe(false);
  });

  it("returns true after a successful proof", () => {
    const state = publishProof(makeState(), THRESHOLD_51_PCT, {
      founderShares: 6n,
      totalDilutedShares: 10n,
    });
    expect(isCurrentlyValid(state)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Basis-points edge cases
// ---------------------------------------------------------------------------

describe("basis-point arithmetic precision", () => {
  it("correctly evaluates exactly 0.01% (1 basis point) threshold", () => {
    const state = makeState();
    // threshold = 1 bp; founders hold 1/10000 share
    const next = publishProof(state, 1n, {
      founderShares: 1n,
      totalDilutedShares: 10_000n,
    });
    expect(next.lastProofValid).toBe(true);
  });

  it("correctly evaluates 100% threshold — only valid when founders == total", () => {
    const full = publishProof(makeState(), 10_000n, {
      founderShares: 1_000n,
      totalDilutedShares: 1_000n,
    });
    expect(full.lastProofValid).toBe(true);

    expect(() =>
      publishProof(makeState(), 10_000n, {
        founderShares: 999n,
        totalDilutedShares: 1_000n,
      }),
    ).toThrow("founders below threshold");
  });
});
