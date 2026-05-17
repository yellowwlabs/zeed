"use client";

import { useState } from "react";
import { useWallet } from "./wallet-context";

export function WalletButton() {
  const { status, wallet, error, connect, disconnect } = useWallet();
  const [balances, setBalances] = useState<Record<string, bigint> | null>(null);
  const [showBalances, setShowBalances] = useState(false);

  async function handleFetchBalances() {
    if (!wallet) return;
    const b = await wallet.getShieldedBalances();
    setBalances(b);
    setShowBalances(true);
  }

  if (status === "connected" && wallet) {
    return (
      <div className="flex items-center gap-2">
        {showBalances && balances && (
          <div className="text-xs text-muted-foreground border rounded px-2 py-1">
            {Object.entries(balances).length === 0
              ? "No shielded tokens"
              : Object.entries(balances).map(([token, amt]) => (
                  <span key={token}>{token}: {amt.toString()}</span>
                ))}
          </div>
        )}
        <button
          onClick={handleFetchBalances}
          className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
        >
          Balances
        </button>
        <div className="flex items-center gap-1.5 rounded-md bg-green-500/10 border border-green-500/30 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            1AM Connected
          </span>
        </div>
        <button
          onClick={disconnect}
          className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
        >
          Disconnect
        </button>
      </div>
    );
  }

  if (status === "detecting" || status === "connecting") {
    return (
      <button disabled className="rounded-md border px-3 py-1.5 text-xs opacity-60 cursor-wait">
        {status === "detecting" ? "Detecting wallet..." : "Connecting..."}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => connect("preview")}
        className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
      >
        Connect 1AM Wallet
      </button>
      {(status === "not_found" || status === "error") && error && (
        <p className="text-xs text-destructive max-w-xs text-right">{error}</p>
      )}
    </div>
  );
}
