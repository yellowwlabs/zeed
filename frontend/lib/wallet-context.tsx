"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

type NetworkId = "preview" | "preprod" | "mainnet";

interface ShieldedAddresses {
  encryptionPublicKey: string;
  coinPublicKey: string;
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

interface WalletAPI {
  name: string;
  apiVersion: string;
  connect(networkId: NetworkId): Promise<ConnectedWallet>;
}

declare global {
  interface Window {
    midnight?: Record<string, WalletAPI>;
  }
}

type WalletStatus = "idle" | "detecting" | "not_found" | "connecting" | "connected" | "error";

interface WalletContextType {
  status: WalletStatus;
  wallet: ConnectedWallet | null;
  error: string | null;
  connect: (networkId?: NetworkId) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

async function detect1AMWallet(): Promise<WalletAPI | null> {
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
      const connected = await api.connect(networkId);
      setWallet(connected);
      setStatus("connected");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setStatus("idle");
    setError(null);
  }, []);

  // Auto-reconnect if wallet was previously connected (session hint)
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("wallet_connected") === "1") {
      connect();
    }
  }, [connect]);

  useEffect(() => {
    if (status === "connected") {
      sessionStorage.setItem("wallet_connected", "1");
    } else if (status === "idle") {
      sessionStorage.removeItem("wallet_connected");
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
