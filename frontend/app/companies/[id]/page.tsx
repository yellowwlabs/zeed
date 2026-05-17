"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CompanyPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();

  const resolvedParams = typeof params !== "undefined" && "then" in params ? null : params as { id: string } | null;

  const companyId = resolvedParams?.id ?? "";

  const { data: company, isLoading } = trpc.company.get.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  useEffect(() => {
    if (!loading && !session) {
      router.push("/sign-in");
    }
  }, [loading, session, router]);

  if (loading || !session || isLoading) {
    return <div className="container mx-auto py-16">Loading...</div>;
  }

  if (!company) {
    return <div className="container mx-auto py-16">Company not found</div>;
  }

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{company.legalName}</h1>
            <div className="space-y-1 text-muted-foreground">
              {company.dba && <p>DBA: {company.dba}</p>}
              <p>
                {company.stateOfIncorp} {company.entityType}
              </p>
              {company.ein && <p>EIN: {company.ein}</p>}
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">Primary Address</h2>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <div>
                {(company.primaryAddress as any)?.street || ""}
              </div>
              <div>
                {(company.primaryAddress as any)?.city},{" "}
                {(company.primaryAddress as any)?.state}{" "}
                {(company.primaryAddress as any)?.zip}
              </div>
              <div>{(company.primaryAddress as any)?.country || "USA"}</div>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Deals</h2>
              <Link
                href={`/companies/${company.id}/deals/new`}
                className="text-sm rounded-md bg-primary px-3 py-1 text-primary-foreground"
              >
                + New Deal
              </Link>
            </div>
            {company.deals.length === 0 ? (
              <p className="text-muted-foreground">No deals yet</p>
            ) : (
              <div className="space-y-2">
                {company.deals.map((deal: any) => (
                  <Link
                    key={deal.id}
                    href={`/companies/${company.id}/deals/${deal.id}`}
                    className="block p-4 border rounded-lg hover:bg-accent"
                  >
                    <div className="font-semibold">{deal.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {deal.dealType} • {deal.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <div className="text-2xl font-bold">{company._count.deals}</div>
              <div className="text-sm text-muted-foreground">Active Deals</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {company._count.capTableEntries}
              </div>
              <div className="text-sm text-muted-foreground">Cap Table Entries</div>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Team</h3>
              <Link
                href={`/companies/${company.id}/members`}
                className="text-xs text-blue-600 hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {company.members.map((member: any) => (
                <div key={member.id} className="text-sm p-2 border rounded">
                  <div className="font-medium">{member.user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {member.user.email}
                  </div>
                  <div className="text-xs text-blue-600">{member.role}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
