"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { trpc } from "./trpc/client";

type NetworkId = "preview" | "preprod" | "mainnet";

interface ShieldedAddresses {
  shieldedAddress: string;
  shieldedCoinPublicKey: string;
  shieldedEncryptionPublicKey: string;
}

interface DustBalance {
  cap: bigint;
  balance: bigint;
}

interface WalletConfiguration {
  indexer: string;
  rpc: string;
  proofServer: string;
}

interface ConnectedWallet {
  name: string;
  apiVersion: string;
  networkId: NetworkId;
  getShieldedBalances(): Promise<Record<string, bigint>>;
  getUnshieldedBalances(): Promise<Record<string, bigint>>;
  getDustBalance(): Promise<DustBalance>;
  getShieldedAddresses(): Promise<ShieldedAddresses>;
  getConfiguration(): Promise<WalletConfiguration>;
  balanceUnsealedTransaction(hex: string): Promise<{ tx: string }>;
  submitTransaction(hex: string): Promise<void>;
}

// window.midnight is typed globally by @midnight-ntwrk/dapp-connector-api
// WalletAPI = InitialAPI from the package

type WalletStatus = "idle" | "detecting" | "not_found" | "connecting" | "connected" | "error";

interface WalletContextType {
  status: WalletStatus;
  wallet: ConnectedWallet | null;
  error: string | null;
  connect: (networkId?: NetworkId) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

async function detect1AMWallet(): Promise<InitialAPI | null> {
  for (let i = 0; i < 50; i++) {
    const w = window.midnight?.["1am"];
    if (w) return w;
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveWallet = trpc.wallet.connect.useMutation();
  const removeWallet = trpc.wallet.disconnect.useMutation();

  const connect = useCallback(async (networkId: NetworkId = "preprod") => {
    setStatus("detecting");
    setError(null);

    const api = await detect1AMWallet();
    if (!api) {
      setStatus("not_found");
      setError("1AM wallet not found. Install the extension and refresh.");
      return;
    }

    setStatus("connecting");
    try {
      const connected = await api.connect(networkId) as unknown as ConnectedWallet;
      setWallet(connected);
      setStatus("connected");

      // Save wallet to DB (best-effort — don't block UI on failure)
      try {
        const addresses = await connected.getShieldedAddresses();
        await saveWallet.mutateAsync({
          networkId,
          encryptionPublicKey: addresses.shieldedEncryptionPublicKey,
          coinPublicKey: addresses.shieldedCoinPublicKey,
        });
      } catch (saveErr: any) {
        // If it's a conflict (wallet belongs to another account), disconnect
        if (saveErr?.data?.code === "CONFLICT" || saveErr?.message?.includes("another account")) {
          setWallet(null);
          setStatus("error");
          setError("This wallet is already connected to another account.");
          localStorage.removeItem("wallet_connected");
          return;
        }
        // Other errors (e.g. not logged in) — wallet still usable locally
        console.warn("Could not save wallet to DB:", saveErr?.message);
      }
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    }
  }, [saveWallet]);

  const disconnect = useCallback(() => {
    setWallet(null);
    setStatus("idle");
    setError(null);
    removeWallet.mutate();
  }, [removeWallet]);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("wallet_connected") === "1") {
      connect();
    }
  }, [connect]);

  useEffect(() => {
    if (status === "connected") {
      localStorage.setItem("wallet_connected", "1");
    } else if (status === "idle") {
      localStorage.removeItem("wallet_connected");
    }
  }, [status]);

  return (
    <WalletContext.Provider value={{ status, wallet, error, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
