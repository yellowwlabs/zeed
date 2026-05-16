"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/sign-in");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div className="container mx-auto py-16">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <main className="container mx-auto py-16 max-w-2xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Welcome, {session.user.name}!</h1>
        <p className="text-lg text-muted-foreground">
          Let's set up your fundraising workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/companies/new"
          className="p-6 border-2 border-dashed rounded-lg hover:bg-accent hover:border-primary transition"
        >
          <h2 className="text-xl font-semibold mb-2">Create a Company</h2>
          <p className="text-sm text-muted-foreground">
            Set up your operating company and start managing deals.
          </p>
        </Link>

        <Link
          href="/investors/new"
          className="p-6 border-2 border-dashed rounded-lg hover:bg-accent hover:border-primary transition"
        >
          <h2 className="text-xl font-semibold mb-2">Create an Investor Entity</h2>
          <p className="text-sm text-muted-foreground">
            Set up your investor fund or vehicle.
          </p>
        </Link>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex-1 rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex-1 rounded-md border px-6 py-3 font-medium"
        >
          Skip for Now
        </button>
      </div>
    </main>
  );
}
