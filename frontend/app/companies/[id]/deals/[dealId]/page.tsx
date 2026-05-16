// src/app/companies/[id]/deals/[dealId]/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string; dealId: string }>;
}

export default async function DealPage({ params }: Props) {
  const { id: companyId, dealId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const deal = await db.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: {
      company: true,
      investments: { include: { investor: true } },
      documents: { select: { id: true, title: true, status: true } },
      _count: { select: { investments: true } },
    },
  });

  const isMember = await db.companyMember.findUnique({
    where: {
      userId_companyId: { userId: session.user.id, companyId: deal.companyId },
    },
  });

  if (!isMember) redirect("/dashboard");

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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{deal.name}</h1>
            <div className="space-y-1 text-muted-foreground">
              <p>{deal.dealType.replace("_", " ")}</p>
              <p>Status: {deal.status}</p>
            </div>
          </div>

          {/* Deal Terms */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Deal Terms</h2>
            <div className="grid grid-cols-2 gap-6 bg-muted p-6 rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Target Amount</div>
                <div className="text-2xl font-bold">
                  ${deal.targetAmount.toLocaleString()}
                </div>
              </div>
              {deal.minimumAmount && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Minimum Amount
                  </div>
                  <div className="text-2xl font-bold">
                    ${deal.minimumAmount.toLocaleString()}
                  </div>
                </div>
              )}
              {deal.closingDeadline && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    Closing Deadline
                  </div>
                  <div className="font-medium">
                    {deal.closingDeadline.toLocaleDateString()}
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

          {/* Instrument-Specific Terms */}
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

          {/* Investments */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Investments</h2>
              {deal.status === "DRAFT" && (
                <button
                  onClick={() => {
                    // TODO: Implement open for investment
                  }}
                  className="text-sm rounded-md bg-primary px-3 py-1 text-primary-foreground"
                >
                  Open for Investment
                </button>
              )}
            </div>
            {deal.investments.length === 0 ? (
              <p className="text-muted-foreground">No investments yet</p>
            ) : (
              <div className="space-y-2">
                {deal.investments.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="font-semibold">
                      {inv.investor.entityName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${inv.amount.toLocaleString()} • {inv.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">
                Investments Raised
              </div>
              <div className="text-2xl font-bold">
                $
                {deal.investments
                  .reduce((sum, inv) => sum + Number(inv.amount), 0)
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

          {/* Documents */}
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
                {deal.documents.map((doc) => (
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
