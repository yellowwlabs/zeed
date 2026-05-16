// src/app/companies/[id]/deals/new/form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc/client";

interface Props {
  companyId: string;
}

export function NewDealForm({ companyId }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);

  const createDeal = trpc.deal.create.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    dealType: "SAFE_ROUND" as "SAFE_ROUND" | "NOTE_ROUND",
    targetAmount: "",
    minimumAmount: "",
    closingDeadline: "",
    valuationCap: "",
    discountRate: "",
    mfnEnabled: false,
    proRataEnabled: false,
    interestRate: "",
    maturityMonths: "24",
    qualifiedFinancingMin: "",
    maturityTreatment: "NEGOTIATE" as "CONVERT_AT_CAP" | "REPAY" | "NEGOTIATE",
    governingLaw: "Delaware",
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
      let defaultTerms: any;

      if (formData.dealType === "SAFE_ROUND") {
        defaultTerms = {
          valuationCap: formData.valuationCap || undefined,
          discountRate: formData.discountRate ? parseFloat(formData.discountRate) : undefined,
          mfnEnabled: formData.mfnEnabled,
          proRataEnabled: formData.proRataEnabled,
          governingLaw: formData.governingLaw,
        };
      } else {
        defaultTerms = {
          interestRate: parseFloat(formData.interestRate),
          maturityMonths: parseInt(formData.maturityMonths),
          valuationCap: formData.valuationCap || undefined,
          discountRate: formData.discountRate ? parseFloat(formData.discountRate) : undefined,
          qualifiedFinancingMin: formData.qualifiedFinancingMin,
          maturityTreatment: formData.maturityTreatment,
          governingLaw: formData.governingLaw,
        };
      }

      const deal = await createDeal.mutateAsync({
        companyId,
        name: formData.name,
        dealType: formData.dealType,
        targetAmount: formData.targetAmount,
        minimumAmount: formData.minimumAmount || undefined,
        closingDeadline: formData.closingDeadline ? new Date(formData.closingDeadline) : undefined,
        defaultTerms,
      });

      router.push(`/companies/${companyId}/deals/${deal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deal");
    }
  }

  return (
    <main className="container mx-auto py-16 max-w-3xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-8">Create a New Deal</h1>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Deal Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Series A"
              className="w-full rounded-md border px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Deal Type *</label>
              <select
                value={formData.dealType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dealType: e.target.value as "SAFE_ROUND" | "NOTE_ROUND",
                  })
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="SAFE_ROUND">SAFE Round</option>
                <option value="NOTE_ROUND">Convertible Note Round</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Governing Law
              </label>
              <input
                type="text"
                value={formData.governingLaw}
                onChange={(e) =>
                  setFormData({ ...formData, governingLaw: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </section>

        {/* Fundraising Terms */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Fundraising Terms</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Target Amount ($) *
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Minimum Amount ($)
              </label>
              <input
                type="number"
                value={formData.minimumAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minimumAmount: e.target.value })
                }
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Closing Deadline
            </label>
            <input
              type="date"
              value={formData.closingDeadline}
              onChange={(e) =>
                setFormData({ ...formData, closingDeadline: e.target.value })
              }
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </section>

        {/* Deal-specific Terms */}
        {formData.dealType === "SAFE_ROUND" ? (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">SAFE Terms</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valuation Cap ($)
                </label>
                <input
                  type="number"
                  value={formData.valuationCap}
                  onChange={(e) =>
                    setFormData({ ...formData, valuationCap: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.discountRate}
                  onChange={(e) =>
                    setFormData({ ...formData, discountRate: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.mfnEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, mfnEnabled: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">
                  Most Favored Nation (MFN) Clause
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.proRataEnabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proRataEnabled: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm">Pro-Rata Rights</span>
              </label>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Convertible Note Terms</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Interest Rate (%) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={(e) =>
                    setFormData({ ...formData, interestRate: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Maturity (months) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.maturityMonths}
                  onChange={(e) =>
                    setFormData({ ...formData, maturityMonths: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Valuation Cap ($)
                </label>
                <input
                  type="number"
                  value={formData.valuationCap}
                  onChange={(e) =>
                    setFormData({ ...formData, valuationCap: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.discountRate}
                  onChange={(e) =>
                    setFormData({ ...formData, discountRate: e.target.value })
                  }
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Qualified Financing Minimum ($) *
              </label>
              <input
                type="number"
                value={formData.qualifiedFinancingMin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    qualifiedFinancingMin: e.target.value,
                  })
                }
                className="w-full rounded-md border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Maturity Treatment *
              </label>
              <select
                value={formData.maturityTreatment}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maturityTreatment: e.target.value as "CONVERT_AT_CAP" | "REPAY" | "NEGOTIATE",
                  })
                }
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="CONVERT_AT_CAP">Convert at Cap</option>
                <option value="REPAY">Repay</option>
                <option value="NEGOTIATE">Negotiate</option>
              </select>
            </div>
          </section>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={createDeal.isPending}
          className="w-full rounded-md bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50"
        >
          {createDeal.isPending ? "Creating..." : "Create Deal"}
        </button>
      </form>
    </main>
  );
}
