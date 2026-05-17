"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

interface Props {
  params: Promise<{ id: string; dealId: string }>;
}

export default function DealPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [companyId, setCompanyId] = useState<string>("");
  const [dealId, setDealId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setCompanyId(resolved.id);
      setDealId(resolved.dealId);
    };
    resolveParams();
  }, [params]);

  const { data: deal, isLoading } = trpc.deal.get.useQuery(
    { dealId },
    { enabled: !!session && !!dealId }
  );

  const openForInvestment = trpc.deal.openForInvestment.useMutation();

  const handleOpenForInvestment = async () => {
    if (!deal) return;
    await openForInvestment.mutateAsync({ dealId: deal.id, companyId });
    router.refresh();
  };

  useEffect(() => {
    if (!loading && !session) {
      router.push("/sign-in");
    }
  }, [loading, session, router]);

  if (loading || !session || isLoading || !deal) {
    return <div className="container mx-auto py-16">Loading...</div>;
  }

  const terms = deal.defaultTerms as any;
  const isSafe = deal.dealType === "SAFE_ROUND";

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <Link
          href={`/companies/${companyId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Company
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{deal.name}</h1>
            <div className="space-y-1 text-muted-foreground">
              <p>{deal.dealType.replace("_", " ")}</p>
              <p>Status: {deal.status}</p>
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">Deal Terms</h2>
            <div className="grid grid-cols-2 gap-6 bg-muted p-6 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Target Amount</div>
                <div className="text-2xl font-bold">
                  ${Number(deal.targetAmount).toLocaleString()}
                </div>
              </div>
              {deal.minimumAmount && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Minimum Amount
                  </div>
                  <div className="text-2xl font-bold">
                    ${Number(deal.minimumAmount).toLocaleString()}
                  </div>
                </div>
              )}
              {deal.closingDeadline && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Closing Deadline
                  </div>
                  <div className="font-medium">
                    {new Date(deal.closingDeadline).toLocaleDateString()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">
                  Governing Law
                </div>
                <div className="font-medium">{terms.governingLaw}</div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">
              {isSafe ? "SAFE Terms" : "Convertible Note Terms"}
            </h2>
            <div className="space-y-3 bg-muted p-6 rounded-lg text-sm">
              {isSafe ? (
                <>
                  {terms.valuationCap && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valuation Cap</span>
                      <span className="font-medium">
                        ${parseFloat(terms.valuationCap).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {terms.discountRate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount Rate</span>
                      <span className="font-medium">{terms.discountRate}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">MFN Clause</span>
                    <span className="font-medium">
                      {terms.mfnEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pro-Rata Rights</span>
                    <span className="font-medium">
                      {terms.proRataEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate</span>
                    <span className="font-medium">{terms.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maturity</span>
                    <span className="font-medium">{terms.maturityMonths} months</span>
                  </div>
                  {terms.valuationCap && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valuation Cap</span>
                      <span className="font-medium">
                        ${parseFloat(terms.valuationCap).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {terms.discountRate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount Rate</span>
                      <span className="font-medium">{terms.discountRate}%</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Qualified Financing Min
                    </span>
                    <span className="font-medium">
                      ${parseFloat(terms.qualifiedFinancingMin).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Maturity Treatment
                    </span>
                    <span className="font-medium">
                      {terms.maturityTreatment.replace(/_/g, " ")}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Investments</h2>
              {deal.status === "DRAFT" && (
                <button
                  onClick={handleOpenForInvestment}
                  disabled={openForInvestment.isPending}
                  className="text-sm rounded-md bg-primary px-3 py-1 text-primary-foreground disabled:opacity-50"
                >
                  {openForInvestment.isPending ? "Opening..." : "Open for Investment"}
                </button>
              )}
            </div>
            {deal.investments.length === 0 ? (
              <p className="text-muted-foreground">No investments yet</p>
            ) : (
              <div className="space-y-2">
                {deal.investments.map((inv: any) => (
                  <div
                    key={inv.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="font-semibold">
                      {inv.investor.entityName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${Number(inv.amount).toLocaleString()} • {inv.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Investments Raised
              </div>
              <div className="text-2xl font-bold">
                $
                {deal.investments
                  .reduce((sum: number, inv: any) => sum + Number(inv.amount), 0)
                  .toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Number of Investors
              </div>
              <div className="text-2xl font-bold">
                {deal._count.investments}
              </div>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Documents</h3>
              <Link
                href={`/companies/${companyId}/deals/${dealId}/documents/new`}
                className="text-xs text-blue-600 hover:underline"
              >
                Generate
              </Link>
            </div>
            {deal.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents</p>
            ) : (
              <div className="space-y-2">
                {deal.documents.map((doc: any) => (
                  <Link
                    key={doc.id}
                    href={`/companies/${companyId}/deals/${dealId}/documents/${doc.id}`}
                    className="block text-sm p-2 border rounded hover:bg-accent"
                  >
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
