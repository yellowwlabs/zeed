"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, DollarSign, TrendingUp, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function AccreditationPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [method, setMethod] = useState<"income" | "netWorth" | null>(null);
  const [amount, setAmount] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const { data: proof, isLoading: proofLoading } = trpc.accreditation.getMyProof.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: validity } = trpc.accreditation.checkValidity.useQuery(undefined, {
    enabled: !!session && !!proof,
  });

  const proveByIncome = trpc.accreditation.proveByIncome.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.accreditation.getMyProof.invalidate();
      utils.accreditation.checkValidity.invalidate();
    },
    onError: (e: { message: string }) => setError(e.message),
  });

  const proveByNetWorth = trpc.accreditation.proveByNetWorth.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      utils.accreditation.getMyProof.invalidate();
      utils.accreditation.checkValidity.invalidate();
    },
    onError: (e: { message: string }) => setError(e.message),
  });

  const revoke = trpc.accreditation.revoke.useMutation({
    onSuccess: () => {
      utils.accreditation.getMyProof.invalidate();
      utils.accreditation.checkValidity.invalidate();
      setSubmitted(false);
    },
  });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    // Backend expects cents as a string (BigInt-safe)
    const amountCentsStr = Math.round(amountNum * 100).toString();
    if (method === "income") {
      await proveByIncome.mutateAsync({
        annualIncomeCents: amountCentsStr,
        contractAddress: contractAddress || undefined,
      });
    } else {
      await proveByNetWorth.mutateAsync({
        netWorthCents: amountCentsStr,
        contractAddress: contractAddress || undefined,
      });
    }
  };

  // checkValidity returns { valid, proof }, not { isValid }
  const isValid = validity?.valid;
  const isPending = proveByIncome.isPending || proveByNetWorth.isPending;

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-white font-sans">
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0d0d] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white">Accreditation</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8">
        {!proofLoading && (
          <div className={`rounded-2xl border p-6 ${proof ? (isValid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20") : "bg-[#111] border-white/5"}`}>
            <div className="flex items-center gap-3 mb-3">
              {proof ? (
                isValid
                  ? <CheckCircle className="w-6 h-6 text-[#00ff88]" />
                  : <XCircle className="w-6 h-6 text-red-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
              <h2 className="text-lg font-bold text-white">
                {proof ? (isValid ? "Accredited Investor" : "Proof Expired") : "Not Accredited"}
              </h2>
            </div>
            {proof ? (
              <div className="space-y-1 text-sm text-gray-400">
                <p>Proof type: <span className="text-white font-semibold">{proof.proofType}</span></p>
                {proof.verifiedAt && (
                  <p>Verified: <span className="text-white font-semibold">{new Date(proof.verifiedAt).toLocaleDateString()}</span></p>
                )}
                <p>Expires: <span className={`font-semibold ${isValid ? "text-[#00ff88]" : "text-red-400"}`}>{new Date(proof.expiresAt).toLocaleDateString()}</span></p>
                {proof.contractAddress && (
                  <p className="text-xs font-mono text-gray-500 mt-2">On-chain: {proof.contractAddress}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Submit proof of accreditation below to unlock investor features.</p>
            )}
            {proof && (
              <button onClick={() => revoke.mutate()} className="mt-4 text-xs text-red-400 hover:text-red-300 transition-colors">
                Revoke accreditation
              </button>
            )}
          </div>
        )}

        {(!proof || !isValid) && !submitted && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Submit Accreditation Proof</h2>
            <p className="text-sm text-gray-400">
              SEC Rule 501 requires annual income ≥ $200,000 or net worth ≥ $1,000,000 (excluding primary residence). Valid for 90 days.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod("income")}
                className={`p-4 rounded-xl border text-left transition-all ${method === "income" ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-[#1a1a1a] hover:border-white/10"}`}
              >
                <DollarSign className={`w-5 h-5 mb-2 ${method === "income" ? "text-blue-400" : "text-gray-500"}`} />
                <p className="font-semibold text-sm text-white">By Income</p>
                <p className="text-xs text-gray-500 mt-0.5">Annual income ≥ $200,000</p>
              </button>
              <button
                onClick={() => setMethod("netWorth")}
                className={`p-4 rounded-xl border text-left transition-all ${method === "netWorth" ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-[#1a1a1a] hover:border-white/10"}`}
              >
                <TrendingUp className={`w-5 h-5 mb-2 ${method === "netWorth" ? "text-blue-400" : "text-gray-500"}`} />
                <p className="font-semibold text-sm text-white">By Net Worth</p>
                <p className="text-xs text-gray-500 mt-0.5">Net worth ≥ $1,000,000</p>
              </button>
            </div>

            {method && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1 block">
                    {method === "income" ? "Annual Income (USD)" : "Net Worth (USD)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={method === "income" ? "200000" : "1000000"}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1 block">
                    On-chain Contract Address <span className="text-gray-600 font-normal">(optional — if deployed)</span>
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  {isPending ? "Submitting..." : "Submit Proof"}
                </button>
              </form>
            )}
          </div>
        )}

        {submitted && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-[#00ff88] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Proof Submitted</h3>
            <p className="text-sm text-gray-400">Your accreditation proof is valid for 90 days.</p>
          </div>
        )}
      </div>
    </div>
  );
}
