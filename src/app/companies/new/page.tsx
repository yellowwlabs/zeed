// src/app/companies/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

export default function NewCompanyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const createCompany = trpc.company.create.useMutation();

  const [formData, setFormData] = useState({
    legalName: "",
    dba: "",
    stateOfIncorp: "DE",
    entityType: "C-Corp",
    ein: "",
    formationDate: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "USA",
    authorizedShares: "",
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
      const company = await createCompany.mutateAsync({
        legalName: formData.legalName,
        dba: formData.dba || undefined,
        stateOfIncorp: formData.stateOfIncorp,
        entityType: formData.entityType,
        ein: formData.ein || undefined,
        formationDate: formData.formationDate
          ? new Date(formData.formationDate)
          : undefined,
        primaryAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
        authorizedShares: formData.authorizedShares
          ? BigInt(formData.authorizedShares)
          : undefined,
      });

      router.push(`/companies/${company.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    }
  }

  return (
    <main className="container mx-auto py-16 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Create a New Company</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Legal Information */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Legal Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Legal Name *</label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) =>
                setFormData({ ...formData, legalName: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              DBA (Doing Business As)
            </label>
            <input
              type="text"
              value={formData.dba}
              onChange={(e) => setFormData({ ...formData, dba: e.target.value })}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                State of Incorporation *
              </label>
              <input
                type="text"
                value={formData.stateOfIncorp}
                onChange={(e) =>
                  setFormData({ ...formData, stateOfIncorp: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
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
                <option>C-Corp</option>
                <option>S-Corp</option>
                <option>LLC</option>
                <option>Partnership</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">EIN</label>
              <input
                type="text"
                value={formData.ein}
                onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
                placeholder="XX-XXXXXXX"
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Formation Date
              </label>
              <input
                type="date"
                value={formData.formationDate}
                onChange={(e) =>
                  setFormData({ ...formData, formationDate: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Authorized Shares
            </label>
            <input
              type="number"
              value={formData.authorizedShares}
              onChange={(e) =>
                setFormData({ ...formData, authorizedShares: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </section>

        {/* Address */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Primary Address</h2>

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
          disabled={createCompany.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {createCompany.isPending ? "Creating..." : "Create Company"}
        </button>
      </form>
    </main>
  );
}
