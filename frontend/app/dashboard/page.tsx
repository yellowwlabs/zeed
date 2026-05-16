// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [companies, investors] = await Promise.all([
    db.company.findMany({
      where: { members: { some: { userId: session.user.id } } },
      include: {
        _count: { select: { deals: true } },
        deals: { where: { status: "OPEN" }, select: { id: true, targetAmount: true } },
      },
    }),
    db.investor.findMany({
      where: { members: { some: { userId: session.user.id } } },
      include: { _count: { select: { investments: true } } },
    }),
  ]);

  return (
    <main className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {session.user.email}
        </p>
      </div>

      <section className="mb-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Companies</h2>
          <Link
            href="/companies/new"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            + New Company
          </Link>
        </div>
        {companies.length === 0 ? (
          <p className="text-muted-foreground">
            You haven&apos;t created or joined any companies yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {companies.map((c) => (
              <Link
                key={c.id}
                href={`/companies/${c.id}`}
                className="p-6 border rounded-lg hover:bg-accent"
              >
                <h3 className="font-semibold">{c.legalName}</h3>
                <p className="text-sm text-muted-foreground">
                  {c.stateOfIncorp} {c.entityType}
                </p>
                <p className="text-sm mt-2">{c._count.deals} deal(s)</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Investor Entities</h2>
          <Link
            href="/investors/new"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            + New Investor
          </Link>
        </div>
        {investors.length === 0 ? (
          <p className="text-muted-foreground">
            You haven&apos;t created or joined any investor entities yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {investors.map((i) => (
              <Link
                key={i.id}
                href={`/investors/${i.id}`}
                className="p-6 border rounded-lg hover:bg-accent"
              >
                <h3 className="font-semibold">{i.entityName}</h3>
                <p className="text-sm text-muted-foreground">{i.entityType}</p>
                <p className="text-sm mt-2">{i._count.investments} investment(s)</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
