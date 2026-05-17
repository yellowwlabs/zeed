"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft, Plus, Building2, Users, BarChart2, ShieldCheck,
  CheckCircle, XCircle, Loader2
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CompanyPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [companyId, setCompanyId] = useState("");

  const [showCapForm, setShowCapForm] = useState(false);
  const [capForm, setCapForm] = useState({
    holderName: "", holderEmail: "", securityType: "COMMON",
    shareCount: "", pricePerShare: "", issueDate: "", certificateNum: "", notes: "",
  });

  const [showFMForm, setShowFMForm] = useState(false);
  const [fmForm, setFmForm] = useState({
    founderShares: "", totalDilutedShares: "", thresholdBps: "5001", contractAddress: "",
  });
  const [fmError, setFmError] = useState("");

  const utils = trpc.useUtils();

  useEffect(() => {
    params.then((p) => setCompanyId(p.id));
  }, [params]);

  const { data: company, isLoading } = trpc.company.get.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: capSummary } = trpc.capTable.summary.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: capEntries = [] } = trpc.capTable.list.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: fmProof } = trpc.founderMajority.getProof.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: fmValid } = trpc.founderMajority.isCurrentlyValid.useQuery(
    { companyId },
    { enabled: !!session && !!companyId && !!fmProof }
  );

  const addCapEntry = trpc.capTable.addEntry.useMutation({
    onSuccess: () => {
      utils.capTable.list.invalidate({ companyId });
      utils.capTable.summary.invalidate({ companyId });
      setShowCapForm(false);
      setCapForm({ holderName: "", holderEmail: "", securityType: "COMMON", shareCount: "", pricePerShare: "", issueDate: "", certificateNum: "", notes: "" });
    },
  });

  const publishFMProof = trpc.founderMajority.publishProof.useMutation({
    onSuccess: () => {
      utils.founderMajority.getProof.invalidate({ companyId });
      utils.founderMajority.isCurrentlyValid.invalidate({ companyId });
      setShowFMForm(false);
      setFmError("");
    },
    onError: (e: { message: string }) => setFmError(e.message),
  });

  const handleCapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCapEntry.mutateAsync({
      companyId,
      holderName: capForm.holderName,
      holderEmail: capForm.holderEmail || undefined,
      securityType: capForm.securityType as "COMMON" | "PREFERRED_SEED" | "PREFERRED_A" | "SAFE" | "NOTE" | "OPTION" | "WARRANT",
      shareCount: capForm.shareCount ? BigInt(capForm.shareCount) : undefined,
      pricePerShare: capForm.pricePerShare || undefined,
      issueDate: new Date(capForm.issueDate),
      certificateNum: capForm.certificateNum || undefined,
      notes: capForm.notes || undefined,
    });
  };

  const handleFMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFmError("");
    await publishFMProof.mutateAsync({
      companyId,
      founderShares: fmForm.founderShares,
      totalDilutedShares: fmForm.totalDilutedShares,
      thresholdBps: parseInt(fmForm.thresholdBps),
      contractAddress: fmForm.contractAddress || undefined,
    });
  };

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session || isLoading || !company) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  const SECURITY_TYPES = ["COMMON", "PREFERRED_SEED", "PREFERRED_A", "SAFE", "NOTE", "OPTION", "WARRANT"];
  const isProofValid = fmValid?.valid ?? false;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      <nav className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0d0d0d] sticky top-0 z-10 gap-4">
        <Link href="/dashboard" className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Building2 className="w-5 h-5 text-blue-400" />
        <h1 className="text-lg font-bold text-white truncate">{company.legalName}</h1>
        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{company.entityType}</span>
      </nav>

      <div className="max-w-5xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Company Info */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Company Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {company.dba && <div><p className="text-gray-500">DBA</p><p className="text-white font-semibold">{company.dba}</p></div>}
              <div><p className="text-gray-500">State</p><p className="text-white font-semibold">{company.stateOfIncorp}</p></div>
              <div><p className="text-gray-500">Entity Type</p><p className="text-white font-semibold">{company.entityType}</p></div>
              {company.ein && <div><p className="text-gray-500">EIN</p><p className="text-white font-mono font-semibold">{company.ein}</p></div>}
              {company.authorizedShares && <div><p className="text-gray-500">Authorized Shares</p><p className="text-white font-semibold">{company.authorizedShares.toString()}</p></div>}
            </div>
            <div className="pt-2">
              <p className="text-gray-500 text-sm">Address</p>
              <p className="text-white text-sm">{(company.primaryAddress as any)?.street}, {(company.primaryAddress as any)?.city}, {(company.primaryAddress as any)?.state} {(company.primaryAddress as any)?.zip}</p>
            </div>
          </section>

          {/* Deals */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Deals</h2>
              <Link href={`/companies/${company.id}/deals/new`} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> New Deal
              </Link>
            </div>
            {(company as any).deals?.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No deals yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {((company as any).deals ?? []).map((deal: any) => (
                  <Link key={deal.id} href={`/companies/${company.id}/deals/${deal.id}`}
                    className="flex items-center justify-between bg-[#111] border border-white/5 rounded-2xl p-4 hover:bg-[#181818] hover:border-white/10 transition-all">
                    <div>
                      <p className="font-semibold text-white">{deal.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{deal.dealType} · Target: ${Number(deal.targetAmount).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${deal.status === "OPEN" ? "text-[#00ff88] bg-[#00ff88]/10" : "text-gray-400 bg-white/5"}`}>{deal.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Cap Table */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" /> Cap Table
              </h2>
              <button onClick={() => setShowCapForm(!showCapForm)} className="flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>

            {showCapForm && (
              <form onSubmit={handleCapSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Holder Name *</label>
                    <input required value={capForm.holderName} onChange={(e) => setCapForm(f => ({ ...f, holderName: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Holder Email</label>
                    <input type="email" value={capForm.holderEmail} onChange={(e) => setCapForm(f => ({ ...f, holderEmail: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Security Type *</label>
                    <select required value={capForm.securityType} onChange={(e) => setCapForm(f => ({ ...f, securityType: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                      {SECURITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Share Count</label>
                    <input type="number" value={capForm.shareCount} onChange={(e) => setCapForm(f => ({ ...f, shareCount: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="1000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Price Per Share</label>
                    <input type="text" value={capForm.pricePerShare} onChange={(e) => setCapForm(f => ({ ...f, pricePerShare: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="0.001" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Issue Date *</label>
                    <input required type="date" value={capForm.issueDate} onChange={(e) => setCapForm(f => ({ ...f, issueDate: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={addCapEntry.isPending} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {addCapEntry.isPending ? "Adding..." : "Add Entry"}
                  </button>
                  <button type="button" onClick={() => setShowCapForm(false)} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                </div>
              </form>
            )}

            {(capEntries as any[]).length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No cap table entries yet.</p>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Holder</span><span>Security</span><span>Shares</span><span>Date</span>
                </div>
                {(capEntries as any[]).map((entry: any) => (
                  <div key={entry.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{entry.holderName}</p>
                      {entry.holderEmail && <p className="text-xs text-gray-500">{entry.holderEmail}</p>}
                    </div>
                    <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full w-fit">{entry.securityType}</span>
                    <span className="text-sm text-gray-300 font-mono">{entry.shareCount ? entry.shareCount.toString() : "—"}</span>
                    <span className="text-sm text-gray-400">{new Date(entry.issueDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Founder Majority Proof */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> Founder Majority Proof
              </h2>
              <button onClick={() => setShowFMForm(!showFMForm)} className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                {fmProof ? "Update Proof" : "Publish Proof"}
              </button>
            </div>

            {fmProof && (
              <div className={`rounded-2xl border p-5 ${isProofValid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className="flex items-center gap-3 mb-2">
                  {isProofValid ? <CheckCircle className="w-5 h-5 text-[#00ff88]" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  <span className="font-bold text-white">{isProofValid ? "Proof Valid" : "Proof Invalid"}</span>
                  <span className="text-xs text-gray-500">· {fmProof.proofCount} submission{fmProof.proofCount !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-sm text-gray-400">Threshold: {(fmProof.thresholdBps / 100).toFixed(2)}%</p>
                {fmProof.provedAt && <p className="text-xs text-gray-500 mt-1">Last proved: {new Date(fmProof.provedAt).toLocaleDateString()}</p>}
                {fmProof.contractAddress && <p className="text-xs font-mono text-gray-500 mt-1">On-chain: {fmProof.contractAddress}</p>}
              </div>
            )}

            {showFMForm && (
              <form onSubmit={handleFMSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Founder Shares *</label>
                    <input required type="number" value={fmForm.founderShares} onChange={(e) => setFmForm(f => ({ ...f, founderShares: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="5000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Total Diluted Shares *</label>
                    <input required type="number" value={fmForm.totalDilutedShares} onChange={(e) => setFmForm(f => ({ ...f, totalDilutedShares: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="9000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Threshold (basis points) *</label>
                    <input required type="number" value={fmForm.thresholdBps} onChange={(e) => setFmForm(f => ({ ...f, thresholdBps: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="5001 = 50.01%" />
                    <p className="text-xs text-gray-500 mt-1">= {fmForm.thresholdBps ? (parseInt(fmForm.thresholdBps) / 100).toFixed(2) : "0.00"}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Contract Address <span className="text-gray-600 font-normal">(optional)</span></label>
                    <input type="text" value={fmForm.contractAddress} onChange={(e) => setFmForm(f => ({ ...f, contractAddress: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="0x..." />
                  </div>
                </div>
                {fmError && <p className="text-sm text-red-400">{fmError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={publishFMProof.isPending} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {publishFMProof.isPending ? "Publishing..." : "Publish Proof"}
                  </button>
                  <button type="button" onClick={() => { setShowFMForm(false); setFmError(""); }} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Deals</span>
                <span className="text-white font-bold">{(company as any)._count?.deals ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Cap Table Entries</span>
                <span className="text-white font-bold">{(capEntries as any[]).length}</span>
              </div>
              {capSummary && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Shares</span>
                  <span className="text-white font-bold font-mono text-sm">{(capSummary as any).totalShares?.toString() ?? "—"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Team</h2>
            </div>
            {((company as any).members ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-200">{m.user?.name}</p>
                  <p className="text-xs text-gray-500">{m.user?.email}</p>
                </div>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{m.role}</span>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl border p-5 ${isProofValid ? "bg-green-500/5 border-green-500/20" : "bg-[#111] border-white/5"}`}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className={`w-4 h-4 ${isProofValid ? "text-[#00ff88]" : "text-gray-500"}`} />
              <span className="text-sm font-bold text-gray-300">Founder Majority</span>
            </div>
            <p className={`text-xs ${isProofValid ? "text-[#00ff88]" : "text-gray-500"}`}>
              {fmProof ? (isProofValid ? "Proof valid" : "Proof invalid") : "No proof submitted"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
