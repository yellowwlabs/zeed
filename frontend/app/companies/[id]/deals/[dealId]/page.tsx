"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Users, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ id: string; dealId: string }>;
}

export default function DealPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [companyId, setCompanyId] = useState("");
  const [dealId, setDealId] = useState("");

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ investorId: "", amount: "" });
  const [inviteError, setInviteError] = useState("");

  const utils = trpc.useUtils();

  useEffect(() => {
    params.then((p) => { setCompanyId(p.id); setDealId(p.dealId); });
  }, [params]);

  const { data: deal, isLoading } = trpc.deal.get.useQuery(
    { dealId },
    { enabled: !!session && !!dealId }
  );

  const { data: investors = [] } = trpc.investor.list.useQuery(undefined, {
    enabled: !!session,
  });

  const openForInvestment = trpc.deal.openForInvestment.useMutation({
    onSuccess: () => utils.deal.get.invalidate({ dealId }),
  });

  const inviteInvestor = trpc.investment.inviteInvestor.useMutation({
    onSuccess: () => {
      utils.deal.get.invalidate({ dealId });
      setShowInviteForm(false);
      setInviteForm({ investorId: "", amount: "" });
      setInviteError("");
    },
    onError: (e: { message: string }) => setInviteError(e.message),
  });

  const agreeToTerms = trpc.investment.agreeToTerms.useMutation({
    onSuccess: () => utils.deal.get.invalidate({ dealId }),
  });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session || isLoading || !deal) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  const terms = deal.defaultTerms as any;
  const isSafe = deal.dealType === "SAFE_ROUND";

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteForm.investorId) { setInviteError("Select an investor."); return; }
    await inviteInvestor.mutateAsync({
      dealId: deal.id,
      investorId: inviteForm.investorId,
      amount: inviteForm.amount,
      customTerms: undefined,
    });
  };

  const totalRaised = ((deal as any).investments ?? [])
    .filter((i: any) => ["FUNDED", "CLOSED"].includes(i.status))
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      <nav className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0d0d0d] sticky top-0 z-10 gap-4">
        <Link href={`/companies/${companyId}`} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-white truncate">{deal.name}</h1>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${deal.status === "OPEN" ? "text-[#00ff88] bg-[#00ff88]/10" : "text-gray-400 bg-white/5"}`}>{deal.status}</span>
      </nav>

      <div className="max-w-5xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Deal Terms */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Deal Terms</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Type</p><p className="text-white font-semibold">{deal.dealType}</p></div>
              <div><p className="text-gray-500">Target</p><p className="text-white font-semibold">${Number(deal.targetAmount).toLocaleString()}</p></div>
              {deal.minimumAmount && <div><p className="text-gray-500">Minimum</p><p className="text-white font-semibold">${Number(deal.minimumAmount).toLocaleString()}</p></div>}
              {deal.closingDeadline && <div><p className="text-gray-500">Closing</p><p className="text-white font-semibold">{new Date(deal.closingDeadline).toLocaleDateString()}</p></div>}
              {isSafe ? (
                <>
                  {terms?.valuationCap && <div><p className="text-gray-500">Valuation Cap</p><p className="text-white font-semibold">${Number(terms.valuationCap).toLocaleString()}</p></div>}
                  {terms?.discountRate && <div><p className="text-gray-500">Discount Rate</p><p className="text-white font-semibold">{terms.discountRate}%</p></div>}
                  <div><p className="text-gray-500">MFN</p><p className="text-white font-semibold">{terms?.mfnEnabled ? "Yes" : "No"}</p></div>
                  <div><p className="text-gray-500">Pro-rata Rights</p><p className="text-white font-semibold">{terms?.proRataEnabled ? "Yes" : "No"}</p></div>
                </>
              ) : (
                <>
                  {terms?.interestRate && <div><p className="text-gray-500">Interest Rate</p><p className="text-white font-semibold">{terms.interestRate}%</p></div>}
                  {terms?.maturityMonths && <div><p className="text-gray-500">Maturity</p><p className="text-white font-semibold">{terms.maturityMonths} months</p></div>}
                </>
              )}
            </div>

            {deal.status === "DRAFT" && (
              <button
                onClick={() => openForInvestment.mutateAsync({ dealId: deal.id, companyId })}
                disabled={openForInvestment.isPending}
                className="mt-2 bg-[#00ff88] hover:bg-[#00e07a] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {openForInvestment.isPending ? "Opening..." : "Open for Investment"}
              </button>
            )}
          </section>

          {/* Investments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Investors
              </h2>
              {deal.status === "OPEN" && (
                <button onClick={() => setShowInviteForm(!showInviteForm)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                  <Plus className="w-4 h-4" /> Invite Investor
                </button>
              )}
            </div>

            {showInviteForm && (
              <form onSubmit={handleInviteSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-300">Invite Investor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Investor Entity *</label>
                    <select required value={inviteForm.investorId} onChange={(e) => setInviteForm(f => ({ ...f, investorId: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Select investor...</option>
                      {(investors as any[]).map((inv: any) => (
                        <option key={inv.id} value={inv.id}>{inv.entityName} ({inv.entityType})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Investment Amount (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input required type="number" min="0" step="1000" value={inviteForm.amount} onChange={(e) => setInviteForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="25000" />
                    </div>
                  </div>
                </div>
                {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
                {(investors as any[]).length === 0 && (
                  <p className="text-sm text-amber-400">You have no investor entities. <Link href="/investors/new" className="underline">Create one first.</Link></p>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={inviteInvestor.isPending} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {inviteInvestor.isPending ? "Inviting..." : "Send Invite"}
                  </button>
                  <button type="button" onClick={() => { setShowInviteForm(false); setInviteError(""); }} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                </div>
              </form>
            )}

            {((deal as any).investments ?? []).length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No investors yet. {deal.status === "DRAFT" ? "Open the deal first." : "Invite investors above."}</p>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Investor</span><span>Amount</span><span>Status</span><span></span>
                </div>
                {((deal as any).investments ?? []).map((inv: any) => (
                  <div key={inv.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <p className="text-sm font-semibold text-gray-200">{inv.investor?.entityName ?? "—"}</p>
                    <p className="text-sm text-gray-300">${Number(inv.amount).toLocaleString()}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${inv.status === "FUNDED" ? "text-[#00ff88] bg-[#00ff88]/10" : inv.status === "AGREED" ? "text-blue-400 bg-blue-400/10" : "text-gray-400 bg-white/5"}`}>
                      {inv.status}
                    </span>
                    {inv.status === "INVITED" && (
                      <button onClick={() => agreeToTerms.mutate({ investmentId: inv.id })} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-all">
                        Agree
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Progress</h2>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Raised</span>
                <span>{((totalRaised / Number(deal.targetAmount)) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88] rounded-full transition-all" style={{ width: `${Math.min(100, (totalRaised / Number(deal.targetAmount)) * 100)}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-white font-bold">${totalRaised.toLocaleString()}</span>
                <span className="text-gray-500">of ${Number(deal.targetAmount).toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investors</span>
                <span className="text-white font-bold">{((deal as any).investments ?? []).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${deal.status === "OPEN" ? "text-[#00ff88]" : "text-gray-400"}`}>{deal.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
