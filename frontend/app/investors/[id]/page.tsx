"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

interface Props {
  params: Promise<{ id: string }>;
}

export default function InvestorPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [investorId, setInvestorId] = useState<string>("");

  useEffect(() => {
    const resolveParams = async () => {
      const resolved = await params;
      setInvestorId(resolved.id);
    };
    resolveParams();
  }, [params]);

  const { data: investor, isLoading } = trpc.investor.get.useQuery(
    { investorId },
    { enabled: !!session && !!investorId }
  );

  useEffect(() => {
    if (!loading && !session) {
      router.push("/sign-in");
    }
  }, [loading, session, router]);

  if (loading || !session || isLoading || !investor) {
    return <div className="container mx-auto py-16">Loading...</div>;
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
            <h1 className="text-4xl font-bold mb-2">{investor.entityName}</h1>
            <div className="space-y-1 text-muted-foreground">
              <p>
                {investor.entityType} • Jurisdiction: {investor.jurisdiction}
              </p>
              {investor.taxId && <p>Tax ID: {investor.taxId}</p>}
            </div>
          </div>

          <section>
            <h2 className="text-xl font-semibold mb-4">Address</h2>
            <div className="bg-muted p-4 rounded-lg text-sm">
              <div>{(investor.address as any)?.street || ""}</div>
              <div>
                {(investor.address as any)?.city}, {(investor.address as any)?.state}{" "}
                {(investor.address as any)?.zip}
              </div>
              <div>{(investor.address as any)?.country || "USA"}</div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Investments</h2>
            {investor.investments.length === 0 ? (
              <p className="text-muted-foreground">No investments yet</p>
            ) : (
              <div className="space-y-2">
                {investor.investments.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 border rounded-lg"
                  >
                    <div className="font-semibold">{inv.instrumentType}</div>
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
              <div className="text-2xl font-bold">
                {investor._count.investments}
              </div>
              <div className="text-sm text-muted-foreground">Investments</div>
            </div>
          </div>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Team</h3>
              <Link
                href={`/investors/${investor.id}/members`}
                className="text-xs text-blue-600 hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {investor.members.map((member) => (
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
