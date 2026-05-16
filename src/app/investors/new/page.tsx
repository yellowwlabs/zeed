// src/app/investors/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

export default function NewInvestorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const createInvestor = trpc.investor.create.useMutation();

  const [formData, setFormData] = useState({
    entityName: "",
    entityType: "INDIVIDUAL",
    jurisdiction: "DE",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
  });

  if (status === "unauthenticated") {
    router.push("/sign-in");
    return null;
  }

  if (status === "loading" || !session?.user) {
    return <div className="container mx-auto py-16">Loading...</div>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      const investor = await createInvestor.mutateAsync({
        entityName: formData.entityName,
        entityType: formData.entityType as "INDIVIDUAL" | "FUND" | "SPV" | "ANGEL_GROUP",
        jurisdiction: formData.jurisdiction,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
      });

      router.push(`/investors/${investor.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create investor");
    }
  }

  return (
    <main className="container mx-auto py-16 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create a New Investor Entity</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Investor Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Investor Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">
              Entity Name *
            </label>
            <input
              type="text"
              value={formData.entityName}
              onChange={(e) =>
                setFormData({ ...formData, entityName: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Entity Type *
              </label>
              <select
                value={formData.entityType}
                onChange={(e) =>
                  setFormData({ ...formData, entityType: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="FUND">Fund</option>
                <option value="SPV">SPV</option>
                <option value="ANGEL_GROUP">Angel Group</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Jurisdiction *
              </label>
              <input
                type="text"
                value={formData.jurisdiction}
                onChange={(e) =>
                  setFormData({ ...formData, jurisdiction: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Address</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Street *</label>
            <input
              type="text"
              value={formData.street}
              onChange={(e) =>
                setFormData({ ...formData, street: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State *</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) =>
                  setFormData({ ...formData, state: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">ZIP *</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={createInvestor.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {createInvestor.isPending ? "Creating..." : "Create Investor Entity"}
        </button>
      </form>
    </main>
  );
}
