import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvestorPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const investor = await db.investor.findUniqueOrThrow({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { investments: true } },
      investments: { orderBy: { invitedAt: "desc" }, take: 5 },
    },
  });

  const isMember = investor.members.some((m) => m.userId === session.user.id);
  if (!isMember) redirect("/dashboard");

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
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

          {/* Address */}
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

          {/* Investments */}
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

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <div className="text-2xl font-bold">
                {investor._count.investments}
              </div>
              <div className="text-sm text-muted-foreground">Investments</div>
            </div>
          </div>

          {/* Team */}
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
