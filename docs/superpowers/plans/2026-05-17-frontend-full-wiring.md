# Frontend Full Wiring + Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all broken dashboard buttons/navigation, add admin panel at `/admin`, add accreditation proof UI, add cap table + founder-majority proof sections to company page, and add investor invite to deal page.

**Architecture:** Backend gets `role` exposed from `me` endpoint and a new `adminRouter` (listUsers + setRole). Frontend Session type gains `role`. Dashboard gets real navigation and filtering. Five new/updated pages follow the existing dark web3 Tailwind UI pattern established in `web3-dashboard/page.tsx`.

**Tech Stack:** Next.js 14 App Router, tRPC, Prisma, Zod, Tailwind CSS, lucide-react

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `backend/src/services/auth.service.ts` | Add `role` to `findUserById` select |
| Modify | `backend/src/routes/v1/auth.ts` | No change needed (controller calls service) |
| Create | `backend/src/routes/v1/admin.ts` | `listUsers` + `setRole` admin procedures |
| Modify | `backend/src/routes/index.ts` | Register `adminRouter` |
| Modify | `frontend/lib/auth-context.tsx` | Add `role` to Session.user type |
| Modify | `frontend/app/dashboard/page.tsx` | Wire search, filters, nav, company card links |
| Create | `frontend/app/admin/page.tsx` | Admin panel: banner CRUD + user role management |
| Create | `frontend/app/accreditation/page.tsx` | Accreditation proof submission UI |
| Modify | `frontend/app/companies/[id]/page.tsx` | Add cap table section + founder-majority proof section |
| Modify | `frontend/app/companies/[id]/deals/[dealId]/page.tsx` | Add investor invite section |

---

### Task 1: Expose `role` from `findUserById` + add `adminRouter`

**Files:**
- Modify: `backend/src/services/auth.service.ts`
- Create: `backend/src/routes/v1/admin.ts`
- Modify: `backend/src/routes/index.ts`

- [ ] **Step 1: Add `role` to `findUserById` select**

In `backend/src/services/auth.service.ts`, update the `findUserById` method's `select` block:

```typescript
async findUserById(id: string) {
  return this.db.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      companyMembers: { include: { company: true } },
      investorMembers: { include: { investor: true } },
    },
  });
}
```

- [ ] **Step 2: Create `backend/src/routes/v1/admin.ts`**

```typescript
import { z } from "zod";
import { createTRPCRouter } from "../../trpc";
import { adminProcedure } from "../../middlewares/role.middleware";

export const adminRouter = createTRPCRouter({
  listUsers: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  setRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["USER", "ADMIN"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, email: true, role: true },
      });
    }),
});
```

- [ ] **Step 3: Register in `backend/src/routes/index.ts`**

```typescript
import { createTRPCRouter } from "../trpc";
import { authRouter } from "./v1/auth";
import { capTableRouter } from "./v1/capTable";
import { companyRouter } from "./v1/company";
import { dealRouter } from "./v1/deal";
import { investmentRouter } from "./v1/investment";
import { investorRouter } from "./v1/investor";
import { walletRouter } from "./v1/wallet";
import { accreditationRouter } from "./v1/accreditation";
import { founderMajorityRouter } from "./v1/founder-majority";
import { bannerRouter } from "./v1/banner";
import { adminRouter } from "./v1/admin";

export const router = createTRPCRouter({
  auth: authRouter,
  company: companyRouter,
  investor: investorRouter,
  deal: dealRouter,
  investment: investmentRouter,
  capTable: capTableRouter,
  wallet: walletRouter,
  accreditation: accreditationRouter,
  founderMajority: founderMajorityRouter,
  banner: bannerRouter,
  admin: adminRouter,
});
```

- [ ] **Step 4: Type-check backend**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/auth.service.ts backend/src/routes/v1/admin.ts backend/src/routes/index.ts
git commit -m "feat(api): expose role in me endpoint, add adminRouter (listUsers, setRole)"
```

---

### Task 2: Add `role` to frontend Session type

**Files:**
- Modify: `frontend/lib/auth-context.tsx`

- [ ] **Step 1: Update Session interface and `me` mapping**

Replace the entire file content:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { trpc } from "./trpc/client";

interface Session {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string | null;
  };
}

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session, sessionToken: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionTokenState] = useState<string | null>(null);

  const { data: me, isLoading: meLoading, isError: meError } = trpc.auth.me.useQuery(undefined, {
    enabled: !!sessionToken,
    retry: false,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem("sessionToken");
    if (storedToken) {
      setSessionTokenState(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionToken) return;
    if (meLoading) return;
    if (me) {
      setSessionState({
        user: {
          id: me.id,
          email: me.email,
          name: me.name,
          image: me.image,
          role: (me as any).role ?? "USER",
        },
      });
    } else if (meError) {
      setSessionState(null);
      setSessionTokenState(null);
      localStorage.removeItem("sessionToken");
    }
    setLoading(false);
  }, [me, meLoading, meError, sessionToken]);

  const setSession = (newSession: Session, token: string) => {
    setSessionState(newSession);
    setSessionTokenState(token);
    localStorage.setItem("sessionToken", token);
  };

  const clearSession = () => {
    setSessionState(null);
    setSessionTokenState(null);
    localStorage.removeItem("sessionToken");
  };

  return (
    <AuthContext.Provider value={{ session, loading, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

- [ ] **Step 2: Type-check frontend**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/lib/auth-context.tsx
git commit -m "feat(auth): expose role in Session type from me endpoint"
```

---

### Task 3: Fix all broken dashboard buttons and navigation

**Files:**
- Modify: `frontend/app/dashboard/page.tsx`

Replace the entire file with a fully wired version:

- [ ] **Step 1: Replace `frontend/app/dashboard/page.tsx`**

```tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, Home, Compass, Calendar, List, Anchor, BarChart2, User,
  Layers, Settings, ChevronLeft, ChevronRight, CheckCircle,
  LayoutGrid, List as ListIcon, CircleDot, Moon, Twitter,
  MessageCircle, Hash, Building2, TrendingUp, ExternalLink, Shield
} from 'lucide-react';
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

const FILTERS = ['All', 'C-Corp', 'LLC', 'Active', 'Draft'] as const;
type Filter = typeof FILTERS[number];

const COMPANY_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-violet-600",
  "from-cyan-400 to-blue-600",
  "from-pink-400 to-purple-600",
  "from-yellow-400 to-orange-600",
  "from-green-400 to-emerald-600",
  "from-orange-400 to-red-500",
  "from-blue-300 to-blue-600",
];

const BANNER_GRADIENTS = [
  "from-indigo-950/80 via-purple-900/30 to-black",
  "from-blue-950/80 via-cyan-900/30 to-black",
  "from-rose-950/80 via-pink-900/30 to-black",
  "from-emerald-950/80 via-teal-900/30 to-black",
];

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [activeBanner, setActiveBanner] = useState(0);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [rightTab, setRightTab] = useState<'Companies' | 'Deals'>('Companies');

  const { data: companies = [] } = trpc.company.list.useQuery(undefined, { enabled: !!session });
  const { data: banners = [] } = trpc.banner.list.useQuery(undefined, { enabled: !!session });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  const filteredCompanies = useMemo(() => {
    let list = companies as any[];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.legalName.toLowerCase().includes(q) ||
        c.entityType?.toLowerCase().includes(q) ||
        c.stateOfIncorp?.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== 'All') {
      if (activeFilter === 'Active') list = list.filter((c) => (c._count?.deals ?? 0) > 0);
      else if (activeFilter === 'Draft') list = list.filter((c) => (c._count?.deals ?? 0) === 0);
      else list = list.filter((c) => c.entityType === activeFilter);
    }
    return list;
  }, [companies, search, activeFilter]);

  const isAdmin = session?.user?.role === "ADMIN";

  if (loading || !session) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const currentBanner = banners[activeBanner];

  return (
    <div className="h-screen w-full bg-[#0d0d0d] text-white font-sans flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* Top Nav */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#0d0d0d] z-10 relative">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative group max-w-[480px] w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-500 text-gray-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/5 rounded px-2 py-0.5 text-[10px] text-gray-400 font-mono border border-white/5">/</div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeFilter === f
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pl-4">
          <span className="text-xs text-gray-500 hidden md:block">{session.user.email}</span>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl text-xs font-semibold hover:bg-amber-600/30 transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
          )}
          <Link
            href="/companies/new"
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]"
          >
            + New Company
          </Link>
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] hover:bg-[#252525] transition-colors flex items-center justify-center border border-white/5 group">
            <User className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-6rem)]">
        {/* Left Sidebar */}
        <aside className="w-[72px] border-r border-white/5 bg-[#090909] flex flex-col items-center py-6 gap-6 shrink-0 z-10 hidden sm:flex">
          <Link href="/dashboard" className="p-2.5 text-white bg-white/10 rounded-xl shadow-sm"><Home className="w-[22px] h-[22px]" /></Link>
          <Link href="/companies/new" className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Compass className="w-[22px] h-[22px]" /></Link>
          <Link href="/accreditation" className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Calendar className="w-[22px] h-[22px]" /></Link>
          <Link href="/investors/new" className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><List className="w-[22px] h-[22px]" /></Link>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Anchor className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><BarChart2 className="w-[22px] h-[22px]" /></button>
          <div className="flex-1" />
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Layers className="w-[22px] h-[22px]" /></button>
          {isAdmin && (
            <Link href="/admin" className="p-2.5 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-all">
              <Shield className="w-[22px] h-[22px]" />
            </Link>
          )}
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Settings className="w-[22px] h-[22px]" /></button>
        </aside>

        {/* Center Content */}
        <main className="flex-1 overflow-y-auto relative p-6 lg:p-10 custom-scrollbar scroll-smooth">
          <div className="max-w-[1400px] mx-auto space-y-12 pb-16">
            {/* Banner Carousel */}
            {banners.length > 0 ? (
              <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${BANNER_GRADIENTS[activeBanner % BANNER_GRADIENTS.length]} border border-white/10 aspect-[3/1] min-h-[340px] flex flex-col justify-end p-8 lg:p-12 group shadow-2xl`}>
                {currentBanner?.imageUrl && (
                  <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-color-dodge transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${currentBanner.imageUrl}')` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="relative z-10 max-w-2xl transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                  <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-2xl mb-3">{currentBanner?.title}</h1>
                  {currentBanner?.subtitle && <p className="text-xl text-gray-300 font-medium mb-6">{currentBanner.subtitle}</p>}
                  {currentBanner?.ctaText && currentBanner?.ctaUrl && (
                    <a href={currentBanner.ctaUrl} className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition-colors shadow-xl">
                      {currentBanner.ctaText}<ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <button onClick={() => setActiveBanner((p) => (p - 1 + banners.length) % banners.length)} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setActiveBanner((p) => (p + 1) % banners.length)} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80">
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => setActiveBanner(i)} className={`h-1.5 rounded-full transition-all ${i === activeBanner ? 'w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-10 bg-white/20 hover:bg-white/50'}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/80 via-purple-900/30 to-black border border-white/10 min-h-[160px] flex items-center justify-center">
                <p className="text-gray-500 text-sm">No announcements</p>
              </div>
            )}

            {/* IPO Listings */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1.5 flex items-center gap-2">
                  IPO Listings
                  <span className="relative flex h-2.5 w-2.5 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                </h2>
                <p className="text-gray-400 text-sm">
                  {filteredCompanies.length} of {(companies as any[]).length} companies
                </p>
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="bg-[#121212] border border-white/5 rounded-2xl p-12 text-center">
                  <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    {search || activeFilter !== 'All' ? 'No companies match your filter.' : 'No companies yet.'}
                  </p>
                  {!search && activeFilter === 'All' && (
                    <Link href="/companies/new" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                      + Create Company
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredCompanies.map((company: any, idx: number) => (
                    <Link
                      key={company.id}
                      href={`/companies/${company.id}`}
                      className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-[#181818] hover:border-white/10 transition-all duration-300 cursor-pointer group shadow-lg"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length]} flex-shrink-0 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                          <Building2 className="w-5 h-5 text-white/80" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors text-sm leading-tight">{company.legalName}</h3>
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            <span className="text-gray-500 font-medium">{company.stateOfIncorp}</span>
                            <span className="text-gray-600">·</span>
                            <span className="text-gray-500">{company.entityType}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${(company._count?.deals ?? 0) > 0 ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-gray-500 bg-white/5'}`}>
                          {company._count?.deals ?? 0} deal{company._count?.deals !== 1 ? 's' : ''}
                        </div>
                        <TrendingUp className="w-3.5 h-3.5 text-gray-600 mt-1 ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 lg:w-[400px] border-l border-white/5 bg-[#0a0a0a] shrink-0 hidden xl:flex flex-col z-10">
          <div className="p-5 border-b border-white/5 bg-[#0d0d0d]">
            <div className="flex items-center justify-between mb-5">
              <div className="bg-[#1a1a1a] p-1 rounded-xl flex items-center border border-white/5">
                <button onClick={() => setRightTab('Companies')} className={`px-5 py-2 text-sm font-bold rounded-lg shadow-md transition-all ${rightTab === 'Companies' ? 'bg-[#2a2a2a] text-white' : 'text-gray-400 hover:text-white'}`}>Companies</button>
                <button onClick={() => setRightTab('Deals')} className={`px-5 py-2 text-sm font-semibold transition-colors ${rightTab === 'Deals' ? 'bg-[#2a2a2a] text-white rounded-lg' : 'text-gray-400 hover:text-white'}`}>Deals</button>
              </div>
              <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/5 p-1">
                <button className="p-1.5 bg-[#2a2a2a] rounded-md text-white shadow"><ListIcon className="w-4 h-4" /></button>
                <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 tracking-widest px-3">
              <span>{rightTab === 'Companies' ? 'COMPANY' : 'DEAL'}</span>
              <span>{rightTab === 'Companies' ? 'DEALS' : 'STATUS'}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {rightTab === 'Companies' ? (
              (companies as any[]).map((company: any, idx: number) => (
                <Link key={company.id} href={`/companies/${company.id}`} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-sm font-bold w-5 text-center">{idx + 1}</span>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${COMPANY_GRADIENTS[idx % COMPANY_GRADIENTS.length]} shrink-0 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center`}>
                      <Building2 className="w-5 h-5 text-white/80" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-[15px] text-gray-200 group-hover:text-white transition-colors">{company.legalName}</span>
                        <CheckCircle className="w-4 h-4 text-blue-500 fill-white" />
                      </div>
                      <span className="text-xs text-gray-500">{company.entityType}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[15px] font-bold ${(company._count?.deals ?? 0) > 0 ? 'text-[#00ff88]' : 'text-gray-500'}`}>{company._count?.deals ?? 0}</div>
                    <div className="text-xs text-gray-500">deal{company._count?.deals !== 1 ? 's' : ''}</div>
                  </div>
                </Link>
              ))
            ) : (
              (companies as any[]).flatMap((c: any) => (c.deals ?? [])).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No deals yet</p>
              ) : (
                (companies as any[]).flatMap((c: any) =>
                  (c.deals ?? []).map((d: any) => (
                    <Link key={d.id} href={`/companies/${c.id}/deals/${d.id}`} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/5">
                      <div>
                        <p className="font-bold text-sm text-gray-200 group-hover:text-white">{d.name}</p>
                        <p className="text-xs text-gray-500">{c.legalName}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${d.status === 'OPEN' ? 'text-[#00ff88] bg-[#00ff88]/10' : 'text-gray-400 bg-white/5'}`}>{d.status}</span>
                    </Link>
                  ))
                )
              )
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-10 border-t border-white/5 bg-[#090909] shrink-0 flex items-center justify-between px-5 text-[11px] font-semibold text-gray-500 z-20">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
            </span>
            <span className="text-[#00ff88] uppercase tracking-wider text-[9px]">Live</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span>Midnight Network</span>
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <div className="flex items-center gap-2.5 ml-2">
            <button className="text-gray-500 hover:text-white transition-colors"><MessageCircle className="w-3.5 h-3.5" /></button>
            <button className="text-gray-500 hover:text-white transition-colors"><Hash className="w-3.5 h-3.5" /></button>
            <button className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="uppercase tracking-wider text-[9px]">Companies:</span>
            <span className="text-white font-bold">{(companies as any[]).length}</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <CircleDot className="w-3 h-3" />
            <span className="font-bold">Midnight ZK</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] p-1.5 rounded-md border border-white/5"><Moon className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; border: 2px solid #0d0d0d; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}} />
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/dashboard/page.tsx
git commit -m "feat(dashboard): wire search, filters, nav links, company cards, right sidebar tabs"
```

---

### Task 4: Admin panel at `/admin`

**Files:**
- Create: `frontend/app/admin/page.tsx`

- [ ] **Step 1: Create `frontend/app/admin/page.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Home, Plus, Trash2, Edit3, Check, X, ToggleLeft, ToggleRight,
  Users, Megaphone, ChevronUp, ChevronDown, ArrowLeft
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<"banners" | "users">("banners");

  // Banner form state
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "", subtitle: "", imageUrl: "", ctaText: "", ctaUrl: "", isActive: true, order: 0,
  });

  const utils = trpc.useUtils();

  const { data: banners = [], isLoading: bannersLoading } = trpc.banner.listAll.useQuery(undefined, {
    enabled: !!session && session.user.role === "ADMIN",
  });

  const { data: users = [], isLoading: usersLoading } = trpc.admin.listUsers.useQuery(undefined, {
    enabled: !!session && session.user.role === "ADMIN" && tab === "users",
  });

  const createBanner = trpc.banner.create.useMutation({
    onSuccess: () => { utils.banner.listAll.invalidate(); setShowBannerForm(false); resetForm(); },
  });

  const updateBanner = trpc.banner.update.useMutation({
    onSuccess: () => { utils.banner.listAll.invalidate(); setEditingBanner(null); resetForm(); },
  });

  const deleteBanner = trpc.banner.delete.useMutation({
    onSuccess: () => utils.banner.listAll.invalidate(),
  });

  const setRole = trpc.admin.setRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const resetForm = () => setBannerForm({ title: "", subtitle: "", imageUrl: "", ctaText: "", ctaUrl: "", isActive: true, order: 0 });

  const startEdit = (banner: any) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl ?? "",
      ctaText: banner.ctaText ?? "",
      ctaUrl: banner.ctaUrl ?? "",
      isActive: banner.isActive,
      order: banner.order,
    });
    setShowBannerForm(true);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: bannerForm.title,
      subtitle: bannerForm.subtitle || undefined,
      imageUrl: bannerForm.imageUrl || undefined,
      ctaText: bannerForm.ctaText || undefined,
      ctaUrl: bannerForm.ctaUrl || undefined,
      isActive: bannerForm.isActive,
      order: bannerForm.order,
    };
    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, ...data });
    } else {
      await createBanner.mutateAsync(data);
    }
  };

  useEffect(() => {
    if (!loading && !session) { router.push("/sign-in"); return; }
    if (!loading && session && session.user.role !== "ADMIN") router.push("/dashboard");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-white font-sans">
      {/* Header */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0d0d] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Logged in as</span>
          <span className="text-amber-400 font-semibold">{session.user.email}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6 lg:p-10">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 bg-[#111] border border-white/5 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setTab("banners")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "banners" ? "bg-[#222] text-white shadow" : "text-gray-400 hover:text-white"}`}
          >
            <Megaphone className="w-4 h-4" /> Banners
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "users" ? "bg-[#222] text-white shadow" : "text-gray-400 hover:text-white"}`}
          >
            <Users className="w-4 h-4" /> Users
          </button>
        </div>

        {/* BANNERS TAB */}
        {tab === "banners" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Announcement Banners</h2>
              <button
                onClick={() => { setShowBannerForm(!showBannerForm); setEditingBanner(null); resetForm(); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                <Plus className="w-4 h-4" /> New Banner
              </button>
            </div>

            {/* Banner Form */}
            {showBannerForm && (
              <form onSubmit={handleBannerSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">{editingBanner ? "Edit Banner" : "Create Banner"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1 block">Title *</label>
                    <input required value={bannerForm.title} onChange={(e) => setBannerForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Banner title" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1 block">Subtitle</label>
                    <input value={bannerForm.subtitle} onChange={(e) => setBannerForm(f => ({ ...f, subtitle: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Subtitle text" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1 block">Image URL</label>
                    <input value={bannerForm.imageUrl} onChange={(e) => setBannerForm(f => ({ ...f, imageUrl: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1 block">Order</label>
                    <input type="number" value={bannerForm.order} onChange={(e) => setBannerForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1 block">CTA Text</label>
                    <input value={bannerForm.ctaText} onChange={(e) => setBannerForm(f => ({ ...f, ctaText: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Learn more" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-semibold mb-1 block">CTA URL</label>
                    <input value={bannerForm.ctaUrl} onChange={(e) => setBannerForm(f => ({ ...f, ctaUrl: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="https://..." />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setBannerForm(f => ({ ...f, isActive: !f.isActive }))}>
                    {bannerForm.isActive ? <ToggleRight className="w-8 h-8 text-[#00ff88]" /> : <ToggleLeft className="w-8 h-8 text-gray-500" />}
                  </button>
                  <span className="text-sm text-gray-300">Active</span>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {editingBanner ? "Save Changes" : "Create Banner"}
                  </button>
                  <button type="button" onClick={() => { setShowBannerForm(false); setEditingBanner(null); resetForm(); }} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Banner List */}
            {bannersLoading ? (
              <div className="text-gray-500 text-sm text-center py-8">Loading banners...</div>
            ) : (banners as any[]).length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <Megaphone className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No banners yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(banners as any[]).map((banner: any) => (
                  <div key={banner.id} className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${banner.isActive ? 'bg-[#00ff88]' : 'bg-gray-600'}`} />
                      <div>
                        <p className="font-bold text-white">{banner.title}</p>
                        {banner.subtitle && <p className="text-sm text-gray-400 mt-0.5">{banner.subtitle}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>Order: {banner.order}</span>
                          {banner.ctaText && <span>CTA: {banner.ctaText}</span>}
                          <span className={banner.isActive ? "text-[#00ff88]" : "text-gray-500"}>{banner.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(banner)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteBanner.mutate({ id: banner.id })} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">User Management</h2>
            {usersLoading ? (
              <div className="text-gray-500 text-sm text-center py-8">Loading users...</div>
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>User</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Action</span>
                </div>
                {(users as any[]).map((user: any) => (
                  <div key={user.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all">
                    <span className="text-sm font-semibold text-gray-200">{user.name}</span>
                    <span className="text-sm text-gray-400 truncate">{user.email}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.role === "ADMIN" ? "text-amber-400 bg-amber-400/10 border border-amber-400/20" : "text-gray-400 bg-white/5"}`}>
                      {user.role}
                    </span>
                    <button
                      disabled={user.id === session.user.id}
                      onClick={() => setRole.mutate({ userId: user.id, role: user.role === "ADMIN" ? "USER" : "ADMIN" })}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${user.id === session.user.id ? "text-gray-600 cursor-not-allowed" : user.role === "ADMIN" ? "text-red-400 bg-red-500/10 hover:bg-red-500/20" : "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"}`}
                    >
                      {user.id === session.user.id ? "You" : user.role === "ADMIN" ? "Revoke" : "Promote"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/admin/page.tsx
git commit -m "feat(admin): add /admin panel with banner CRUD and user role management"
```

---

### Task 5: Accreditation proof UI at `/accreditation`

**Files:**
- Create: `frontend/app/accreditation/page.tsx`

- [ ] **Step 1: Create `frontend/app/accreditation/page.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function AccreditationPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [method, setMethod] = useState<"income" | "netWorth" | null>(null);
  const [amount, setAmount] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const utils = trpc.useUtils();

  const { data: proof, isLoading: proofLoading } = trpc.accreditation.getMyProof.useQuery(undefined, {
    enabled: !!session,
  });

  const { data: validity } = trpc.accreditation.checkValidity.useQuery(undefined, {
    enabled: !!session && !!proof,
  });

  const proveByIncome = trpc.accreditation.proveByIncome.useMutation({
    onSuccess: () => { setSubmitted(true); utils.accreditation.getMyProof.invalidate(); utils.accreditation.checkValidity.invalidate(); },
    onError: (e) => setError(e.message),
  });

  const proveByNetWorth = trpc.accreditation.proveByNetWorth.useMutation({
    onSuccess: () => { setSubmitted(true); utils.accreditation.getMyProof.invalidate(); utils.accreditation.checkValidity.invalidate(); },
    onError: (e) => setError(e.message),
  });

  const revoke = trpc.accreditation.revoke.useMutation({
    onSuccess: () => { utils.accreditation.getMyProof.invalidate(); utils.accreditation.checkValidity.invalidate(); setSubmitted(false); },
  });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { setError("Please enter a valid amount."); return; }
    if (method === "income") {
      await proveByIncome.mutateAsync({ annualIncomeCents: amountCents, contractAddress: contractAddress || undefined });
    } else {
      await proveByNetWorth.mutateAsync({ netWorthCents: amountCents, contractAddress: contractAddress || undefined });
    }
  };

  const isValid = validity?.isValid;
  const isPending = proveByIncome.isPending || proveByNetWorth.isPending;

  return (
    <div className="min-h-screen w-full bg-[#0d0d0d] text-white font-sans">
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0d0d0d] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h1 className="text-lg font-bold text-white">Accreditation</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-8">
        {/* Current Status */}
        {!proofLoading && (
          <div className={`rounded-2xl border p-6 ${proof ? (isValid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20") : "bg-[#111] border-white/5"}`}>
            <div className="flex items-center gap-3 mb-3">
              {proof ? (
                isValid
                  ? <CheckCircle className="w-6 h-6 text-[#00ff88]" />
                  : <XCircle className="w-6 h-6 text-red-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-500" />
              )}
              <h2 className="text-lg font-bold text-white">
                {proof ? (isValid ? "Accredited Investor" : "Proof Expired") : "Not Accredited"}
              </h2>
            </div>
            {proof ? (
              <div className="space-y-1 text-sm text-gray-400">
                <p>Proof type: <span className="text-white font-semibold">{proof.proofType}</span></p>
                {proof.verifiedAt && <p>Verified: <span className="text-white font-semibold">{new Date(proof.verifiedAt).toLocaleDateString()}</span></p>}
                <p>Expires: <span className={`font-semibold ${isValid ? "text-[#00ff88]" : "text-red-400"}`}>{new Date(proof.expiresAt).toLocaleDateString()}</span></p>
                {proof.contractAddress && <p className="text-xs font-mono text-gray-500 mt-2">On-chain: {proof.contractAddress}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Submit proof of accreditation below to unlock investor features.</p>
            )}
            {proof && (
              <button onClick={() => revoke.mutate()} className="mt-4 text-xs text-red-400 hover:text-red-300 transition-colors">
                Revoke accreditation
              </button>
            )}
          </div>
        )}

        {/* Proof Submission */}
        {(!proof || !isValid) && !submitted && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white">Submit Accreditation Proof</h2>
            <p className="text-sm text-gray-400">
              SEC Rule 501 requires annual income ≥ $200,000 or net worth ≥ $1,000,000 (excluding primary residence). Valid for 90 days.
            </p>

            {/* Method selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod("income")}
                className={`p-4 rounded-xl border text-left transition-all ${method === "income" ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-[#1a1a1a] hover:border-white/10"}`}
              >
                <DollarSign className={`w-5 h-5 mb-2 ${method === "income" ? "text-blue-400" : "text-gray-500"}`} />
                <p className="font-semibold text-sm text-white">By Income</p>
                <p className="text-xs text-gray-500 mt-0.5">Annual income ≥ $200,000</p>
              </button>
              <button
                onClick={() => setMethod("netWorth")}
                className={`p-4 rounded-xl border text-left transition-all ${method === "netWorth" ? "border-blue-500 bg-blue-500/10" : "border-white/5 bg-[#1a1a1a] hover:border-white/10"}`}
              >
                <TrendingUp className={`w-5 h-5 mb-2 ${method === "netWorth" ? "text-blue-400" : "text-gray-500"}`} />
                <p className="font-semibold text-sm text-white">By Net Worth</p>
                <p className="text-xs text-gray-500 mt-0.5">Net worth ≥ $1,000,000</p>
              </button>
            </div>

            {method && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1 block">
                    {method === "income" ? "Annual Income (USD)" : "Net Worth (USD)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={method === "income" ? "200000" : "1000000"}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1 block">
                    On-chain Contract Address <span className="text-gray-600 font-normal">(optional — if deployed)</span>
                  </label>
                  <input
                    type="text"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold transition-all"
                >
                  {isPending ? "Submitting..." : "Submit Proof"}
                </button>
              </form>
            )}
          </div>
        )}

        {submitted && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center">
            <CheckCircle className="w-10 h-10 text-[#00ff88] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Proof Submitted</h3>
            <p className="text-sm text-gray-400">Your accreditation proof is valid for 90 days.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/accreditation/page.tsx
git commit -m "feat(accreditation): add proof submission UI with income and net worth methods"
```

---

### Task 6: Cap table + founder majority proof sections on company page

**Files:**
- Modify: `frontend/app/companies/[id]/page.tsx`

Read the full existing file first, then replace entirely:

- [ ] **Step 1: Replace `frontend/app/companies/[id]/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowLeft, Plus, Building2, Users, BarChart2, ShieldCheck,
  CheckCircle, XCircle, AlertCircle, Loader2
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CompanyPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [companyId, setCompanyId] = useState("");

  // Cap table form state
  const [showCapForm, setShowCapForm] = useState(false);
  const [capForm, setCapForm] = useState({
    holderName: "", holderEmail: "", securityType: "COMMON",
    shareCount: "", pricePerShare: "", issueDate: "", certificateNum: "", notes: "",
  });

  // Founder majority form state
  const [showFMForm, setShowFMForm] = useState(false);
  const [fmForm, setFmForm] = useState({
    founderShares: "", totalDilutedShares: "", thresholdBps: "5001", contractAddress: "",
  });
  const [fmError, setFmError] = useState("");

  const utils = trpc.useUtils();

  useEffect(() => {
    params.then((p) => setCompanyId(p.id));
  }, [params]);

  const { data: company, isLoading } = trpc.company.get.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: capSummary } = trpc.capTable.summary.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: capEntries = [] } = trpc.capTable.list.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: fmProof } = trpc.founderMajority.getProof.useQuery(
    { companyId },
    { enabled: !!session && !!companyId }
  );

  const { data: fmValid } = trpc.founderMajority.isCurrentlyValid.useQuery(
    { companyId },
    { enabled: !!session && !!companyId && !!fmProof }
  );

  const addCapEntry = trpc.capTable.addEntry.useMutation({
    onSuccess: () => {
      utils.capTable.list.invalidate({ companyId });
      utils.capTable.summary.invalidate({ companyId });
      setShowCapForm(false);
      setCapForm({ holderName: "", holderEmail: "", securityType: "COMMON", shareCount: "", pricePerShare: "", issueDate: "", certificateNum: "", notes: "" });
    },
  });

  const publishFMProof = trpc.founderMajority.publishProof.useMutation({
    onSuccess: () => {
      utils.founderMajority.getProof.invalidate({ companyId });
      utils.founderMajority.isCurrentlyValid.invalidate({ companyId });
      setShowFMForm(false);
      setFmError("");
    },
    onError: (e) => setFmError(e.message),
  });

  const handleCapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCapEntry.mutateAsync({
      companyId,
      holderName: capForm.holderName,
      holderEmail: capForm.holderEmail || undefined,
      securityType: capForm.securityType as any,
      shareCount: capForm.shareCount ? BigInt(capForm.shareCount) : undefined,
      pricePerShare: capForm.pricePerShare || undefined,
      issueDate: new Date(capForm.issueDate),
      certificateNum: capForm.certificateNum || undefined,
      notes: capForm.notes || undefined,
    });
  };

  const handleFMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFmError("");
    await publishFMProof.mutateAsync({
      companyId,
      founderShares: BigInt(fmForm.founderShares),
      totalDilutedShares: BigInt(fmForm.totalDilutedShares),
      thresholdBps: parseInt(fmForm.thresholdBps),
      contractAddress: fmForm.contractAddress || undefined,
    });
  };

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session || isLoading || !company) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  const SECURITY_TYPES = ["COMMON", "PREFERRED_SEED", "PREFERRED_A", "SAFE", "NOTE", "OPTION", "WARRANT"];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      <nav className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0d0d0d] sticky top-0 z-10 gap-4">
        <Link href="/dashboard" className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Building2 className="w-5 h-5 text-blue-400" />
        <h1 className="text-lg font-bold text-white truncate">{company.legalName}</h1>
        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{company.entityType}</span>
      </nav>

      <div className="max-w-5xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Company Info */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Company Info</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {company.dba && <div><p className="text-gray-500">DBA</p><p className="text-white font-semibold">{company.dba}</p></div>}
              <div><p className="text-gray-500">State</p><p className="text-white font-semibold">{company.stateOfIncorp}</p></div>
              <div><p className="text-gray-500">Entity Type</p><p className="text-white font-semibold">{company.entityType}</p></div>
              {company.ein && <div><p className="text-gray-500">EIN</p><p className="text-white font-mono font-semibold">{company.ein}</p></div>}
              {company.authorizedShares && <div><p className="text-gray-500">Authorized Shares</p><p className="text-white font-semibold">{company.authorizedShares.toString()}</p></div>}
            </div>
            <div className="pt-2">
              <p className="text-gray-500 text-sm">Address</p>
              <p className="text-white text-sm">{(company.primaryAddress as any)?.street}, {(company.primaryAddress as any)?.city}, {(company.primaryAddress as any)?.state} {(company.primaryAddress as any)?.zip}</p>
            </div>
          </section>

          {/* Deals */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Deals</h2>
              <Link href={`/companies/${company.id}/deals/new`} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> New Deal
              </Link>
            </div>
            {(company as any).deals?.length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No deals yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {((company as any).deals ?? []).map((deal: any) => (
                  <Link key={deal.id} href={`/companies/${company.id}/deals/${deal.id}`}
                    className="flex items-center justify-between bg-[#111] border border-white/5 rounded-2xl p-4 hover:bg-[#181818] hover:border-white/10 transition-all">
                    <div>
                      <p className="font-semibold text-white">{deal.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{deal.dealType} · Target: ${Number(deal.targetAmount).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${deal.status === "OPEN" ? "text-[#00ff88] bg-[#00ff88]/10" : "text-gray-400 bg-white/5"}`}>{deal.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Cap Table */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" /> Cap Table
              </h2>
              <button onClick={() => setShowCapForm(!showCapForm)} className="flex items-center gap-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                <Plus className="w-4 h-4" /> Add Entry
              </button>
            </div>

            {showCapForm && (
              <form onSubmit={handleCapSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Holder Name *</label>
                    <input required value={capForm.holderName} onChange={(e) => setCapForm(f => ({ ...f, holderName: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Holder Email</label>
                    <input type="email" value={capForm.holderEmail} onChange={(e) => setCapForm(f => ({ ...f, holderEmail: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Security Type *</label>
                    <select required value={capForm.securityType} onChange={(e) => setCapForm(f => ({ ...f, securityType: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500">
                      {SECURITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Share Count</label>
                    <input type="number" value={capForm.shareCount} onChange={(e) => setCapForm(f => ({ ...f, shareCount: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="1000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Price Per Share</label>
                    <input type="text" value={capForm.pricePerShare} onChange={(e) => setCapForm(f => ({ ...f, pricePerShare: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="0.001" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Issue Date *</label>
                    <input required type="date" value={capForm.issueDate} onChange={(e) => setCapForm(f => ({ ...f, issueDate: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={addCapEntry.isPending} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {addCapEntry.isPending ? "Adding..." : "Add Entry"}
                  </button>
                  <button type="button" onClick={() => setShowCapForm(false)} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                </div>
              </form>
            )}

            {(capEntries as any[]).length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No cap table entries yet.</p>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Holder</span><span>Security</span><span>Shares</span><span>Date</span>
                </div>
                {(capEntries as any[]).map((entry: any) => (
                  <div key={entry.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">{entry.holderName}</p>
                      {entry.holderEmail && <p className="text-xs text-gray-500">{entry.holderEmail}</p>}
                    </div>
                    <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full w-fit">{entry.securityType}</span>
                    <span className="text-sm text-gray-300 font-mono">{entry.shareCount ? entry.shareCount.toString() : "—"}</span>
                    <span className="text-sm text-gray-400">{new Date(entry.issueDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Founder Majority Proof */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> Founder Majority Proof
              </h2>
              <button onClick={() => setShowFMForm(!showFMForm)} className="flex items-center gap-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600/30 px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                {fmProof ? "Update Proof" : "Publish Proof"}
              </button>
            </div>

            {/* Current proof status */}
            {fmProof && (
              <div className={`rounded-2xl border p-5 ${fmValid?.isValid ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                <div className="flex items-center gap-3 mb-2">
                  {fmValid?.isValid ? <CheckCircle className="w-5 h-5 text-[#00ff88]" /> : <XCircle className="w-5 h-5 text-red-400" />}
                  <span className="font-bold text-white">{fmValid?.isValid ? "Proof Valid" : "Proof Invalid"}</span>
                  <span className="text-xs text-gray-500">· {fmProof.proofCount} submission{fmProof.proofCount !== 1 ? "s" : ""}</span>
                </div>
                <p className="text-sm text-gray-400">Threshold: {(fmProof.thresholdBps / 100).toFixed(2)}%</p>
                {fmProof.provedAt && <p className="text-xs text-gray-500 mt-1">Last proved: {new Date(fmProof.provedAt).toLocaleDateString()}</p>}
                {fmProof.contractAddress && <p className="text-xs font-mono text-gray-500 mt-1">On-chain: {fmProof.contractAddress}</p>}
              </div>
            )}

            {showFMForm && (
              <form onSubmit={handleFMSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Founder Shares *</label>
                    <input required type="number" value={fmForm.founderShares} onChange={(e) => setFmForm(f => ({ ...f, founderShares: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="5000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Total Diluted Shares *</label>
                    <input required type="number" value={fmForm.totalDilutedShares} onChange={(e) => setFmForm(f => ({ ...f, totalDilutedShares: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="9000000" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Threshold (basis points) *</label>
                    <input required type="number" value={fmForm.thresholdBps} onChange={(e) => setFmForm(f => ({ ...f, thresholdBps: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="5001 = 50.01%" />
                    <p className="text-xs text-gray-500 mt-1">= {fmForm.thresholdBps ? (parseInt(fmForm.thresholdBps) / 100).toFixed(2) : "0.00"}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Contract Address <span className="text-gray-600 font-normal">(optional)</span></label>
                    <input type="text" value={fmForm.contractAddress} onChange={(e) => setFmForm(f => ({ ...f, contractAddress: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500" placeholder="0x..." />
                  </div>
                </div>
                {fmError && <p className="text-sm text-red-400">{fmError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={publishFMProof.isPending} className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {publishFMProof.isPending ? "Publishing..." : "Publish Proof"}
                  </button>
                  <button type="button" onClick={() => { setShowFMForm(false); setFmError(""); }} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Deals</span>
                <span className="text-white font-bold">{(company as any)._count?.deals ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Cap Table Entries</span>
                <span className="text-white font-bold">{(capEntries as any[]).length}</span>
              </div>
              {capSummary && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Shares</span>
                  <span className="text-white font-bold font-mono text-sm">{(capSummary as any).totalShares?.toString() ?? "—"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Team */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Team</h2>
            </div>
            {((company as any).members ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-200">{m.user?.name}</p>
                  <p className="text-xs text-gray-500">{m.user?.email}</p>
                </div>
                <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full">{m.role}</span>
              </div>
            ))}
          </div>

          {/* Founder Majority Status */}
          <div className={`rounded-2xl border p-5 ${fmValid?.isValid ? "bg-green-500/5 border-green-500/20" : "bg-[#111] border-white/5"}`}>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className={`w-4 h-4 ${fmValid?.isValid ? "text-[#00ff88]" : "text-gray-500"}`} />
              <span className="text-sm font-bold text-gray-300">Founder Majority</span>
            </div>
            <p className={`text-xs ${fmValid?.isValid ? "text-[#00ff88]" : "text-gray-500"}`}>
              {fmProof ? (fmValid?.isValid ? "Proof valid" : "Proof invalid") : "No proof submitted"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/companies/\[id\]/page.tsx
git commit -m "feat(company): add cap table view/entry and founder majority proof UI"
```

---

### Task 7: Investor invite section on deal page

**Files:**
- Modify: `frontend/app/companies/[id]/deals/[dealId]/page.tsx`

- [ ] **Step 1: Replace `frontend/app/companies/[id]/deals/[dealId]/page.tsx`**

Read the existing file first, then replace with:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Users, DollarSign, CheckCircle, Loader2, ExternalLink } from "lucide-react";

interface Props {
  params: Promise<{ id: string; dealId: string }>;
}

export default function DealPage({ params }: Props) {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [companyId, setCompanyId] = useState("");
  const [dealId, setDealId] = useState("");

  // Investor invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ investorId: "", amount: "" });
  const [inviteError, setInviteError] = useState("");

  const utils = trpc.useUtils();

  useEffect(() => {
    params.then((p) => { setCompanyId(p.id); setDealId(p.dealId); });
  }, [params]);

  const { data: deal, isLoading } = trpc.deal.get.useQuery(
    { dealId },
    { enabled: !!session && !!dealId }
  );

  const { data: investors = [] } = trpc.investor.list.useQuery(undefined, {
    enabled: !!session,
  });

  const openForInvestment = trpc.deal.openForInvestment.useMutation({
    onSuccess: () => utils.deal.get.invalidate({ dealId }),
  });

  const inviteInvestor = trpc.investment.inviteInvestor.useMutation({
    onSuccess: () => {
      utils.deal.get.invalidate({ dealId });
      setShowInviteForm(false);
      setInviteForm({ investorId: "", amount: "" });
      setInviteError("");
    },
    onError: (e) => setInviteError(e.message),
  });

  const agreeToTerms = trpc.investment.agreeToTerms.useMutation({
    onSuccess: () => utils.deal.get.invalidate({ dealId }),
  });

  useEffect(() => {
    if (!loading && !session) router.push("/sign-in");
  }, [loading, session, router]);

  if (loading || !session || isLoading || !deal) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-white animate-spin" />
      </div>
    );
  }

  const terms = deal.defaultTerms as any;
  const isSafe = deal.dealType === "SAFE_ROUND";

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteForm.investorId) { setInviteError("Select an investor."); return; }
    await inviteInvestor.mutateAsync({
      dealId: deal.id,
      investorId: inviteForm.investorId,
      amount: inviteForm.amount,
      customTerms: undefined,
    });
  };

  const totalRaised = ((deal as any).investments ?? [])
    .filter((i: any) => ["FUNDED", "CLOSED"].includes(i.status))
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      <nav className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0d0d0d] sticky top-0 z-10 gap-4">
        <Link href={`/companies/${companyId}`} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold text-white truncate">{deal.name}</h1>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${deal.status === "OPEN" ? "text-[#00ff88] bg-[#00ff88]/10" : "text-gray-400 bg-white/5"}`}>{deal.status}</span>
      </nav>

      <div className="max-w-5xl mx-auto p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Deal Terms */}
          <section className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Deal Terms</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-500">Type</p><p className="text-white font-semibold">{deal.dealType}</p></div>
              <div><p className="text-gray-500">Target</p><p className="text-white font-semibold">${Number(deal.targetAmount).toLocaleString()}</p></div>
              {deal.minimumAmount && <div><p className="text-gray-500">Minimum</p><p className="text-white font-semibold">${Number(deal.minimumAmount).toLocaleString()}</p></div>}
              {deal.closingDeadline && <div><p className="text-gray-500">Closing</p><p className="text-white font-semibold">{new Date(deal.closingDeadline).toLocaleDateString()}</p></div>}
              {isSafe ? (
                <>
                  {terms?.valuationCap && <div><p className="text-gray-500">Valuation Cap</p><p className="text-white font-semibold">${Number(terms.valuationCap).toLocaleString()}</p></div>}
                  {terms?.discountRate && <div><p className="text-gray-500">Discount Rate</p><p className="text-white font-semibold">{terms.discountRate}%</p></div>}
                  <div><p className="text-gray-500">MFN</p><p className="text-white font-semibold">{terms?.mfn ? "Yes" : "No"}</p></div>
                  <div><p className="text-gray-500">Pro-rata Rights</p><p className="text-white font-semibold">{terms?.proRataRights ? "Yes" : "No"}</p></div>
                </>
              ) : (
                <>
                  {terms?.interestRate && <div><p className="text-gray-500">Interest Rate</p><p className="text-white font-semibold">{terms.interestRate}%</p></div>}
                  {terms?.maturityMonths && <div><p className="text-gray-500">Maturity</p><p className="text-white font-semibold">{terms.maturityMonths} months</p></div>}
                </>
              )}
            </div>

            {deal.status === "DRAFT" && (
              <button
                onClick={() => openForInvestment.mutateAsync({ dealId: deal.id, companyId })}
                disabled={openForInvestment.isPending}
                className="mt-2 bg-[#00ff88] hover:bg-[#00e07a] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-all disabled:opacity-50"
              >
                {openForInvestment.isPending ? "Opening..." : "Open for Investment"}
              </button>
            )}
          </section>

          {/* Investments */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" /> Investors
              </h2>
              {deal.status === "OPEN" && (
                <button onClick={() => setShowInviteForm(!showInviteForm)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all">
                  <Plus className="w-4 h-4" /> Invite Investor
                </button>
              )}
            </div>

            {showInviteForm && (
              <form onSubmit={handleInviteSubmit} className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-300">Invite Investor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Investor Entity *</label>
                    <select required value={inviteForm.investorId} onChange={(e) => setInviteForm(f => ({ ...f, investorId: e.target.value }))}
                      className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option value="">Select investor...</option>
                      {(investors as any[]).map((inv: any) => (
                        <option key={inv.id} value={inv.id}>{inv.entityName} ({inv.entityType})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 mb-1 block">Investment Amount (USD) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input required type="number" min="0" step="1000" value={inviteForm.amount} onChange={(e) => setInviteForm(f => ({ ...f, amount: e.target.value }))}
                        className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="25000" />
                    </div>
                  </div>
                </div>
                {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
                {(investors as any[]).length === 0 && (
                  <p className="text-sm text-amber-400">You have no investor entities. <Link href="/investors/new" className="underline">Create one first.</Link></p>
                )}
                <div className="flex gap-3">
                  <button type="submit" disabled={inviteInvestor.isPending} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all">
                    {inviteInvestor.isPending ? "Inviting..." : "Send Invite"}
                  </button>
                  <button type="button" onClick={() => { setShowInviteForm(false); setInviteError(""); }} className="bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2 rounded-xl text-sm font-semibold transition-all">Cancel</button>
                </div>
              </form>
            )}

            {((deal as any).investments ?? []).length === 0 ? (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
                <p className="text-gray-500 text-sm">No investors yet. {deal.status === "DRAFT" ? "Open the deal first." : "Invite investors above."}</p>
              </div>
            ) : (
              <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>Investor</span><span>Amount</span><span>Status</span><span></span>
                </div>
                {((deal as any).investments ?? []).map((inv: any) => (
                  <div key={inv.id} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <p className="text-sm font-semibold text-gray-200">{inv.investor?.entityName ?? "—"}</p>
                    <p className="text-sm text-gray-300">${Number(inv.amount).toLocaleString()}</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full w-fit ${inv.status === "FUNDED" ? "text-[#00ff88] bg-[#00ff88]/10" : inv.status === "AGREED" ? "text-blue-400 bg-blue-400/10" : "text-gray-400 bg-white/5"}`}>
                      {inv.status}
                    </span>
                    {inv.status === "INVITED" && (
                      <button onClick={() => agreeToTerms.mutate({ investmentId: inv.id })} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-400/10 transition-all">
                        Agree
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Progress</h2>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Raised</span>
                <span>{((totalRaised / Number(deal.targetAmount)) * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-[#00ff88] rounded-full transition-all" style={{ width: `${Math.min(100, (totalRaised / Number(deal.targetAmount)) * 100)}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-white font-bold">${totalRaised.toLocaleString()}</span>
                <span className="text-gray-500">of ${Number(deal.targetAmount).toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Investors</span>
                <span className="text-white font-bold">{((deal as any).investments ?? []).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className={`font-bold ${deal.status === "OPEN" ? "text-[#00ff88]" : "text-gray-400"}`}>{deal.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/samarthhhh/Documents/yellowlabs/Midnight-DeFi-Angel/frontend && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "frontend/app/companies/[id]/deals/[dealId]/page.tsx"
git commit -m "feat(deal): add investor invite UI, investment list with agree-to-terms, progress bar"
```

---

## Self-Review

- [x] **Spec coverage:**
  - Backend role in `me` ✓ | adminRouter listUsers + setRole ✓
  - Session type includes role ✓
  - Dashboard: search filter ✓ | category filter ✓ | company card links ✓ | "+ New Company" link ✓ | left sidebar nav ✓ | right sidebar tabs ✓ | admin button for ADMIN users ✓
  - Admin panel: banner CRUD ✓ | user role management ✓ | admin-only guard ✓
  - Accreditation: income method ✓ | net worth method ✓ | proof status ✓ | revoke ✓
  - Company page: cap table list ✓ | add entry ✓ | founder majority proof publish ✓ | proof status ✓
  - Deal page: investor invite ✓ | investor list ✓ | agree-to-terms ✓ | progress bar ✓
- [x] **Placeholders:** None — all code blocks are complete
- [x] **Type consistency:** All tRPC procedure names match `routes/index.ts`: `trpc.admin.listUsers`, `trpc.admin.setRole`, `trpc.banner.listAll`, `trpc.banner.create`, `trpc.banner.update`, `trpc.banner.delete`, `trpc.capTable.list`, `trpc.capTable.summary`, `trpc.capTable.addEntry`, `trpc.founderMajority.getProof`, `trpc.founderMajority.isCurrentlyValid`, `trpc.founderMajority.publishProof`, `trpc.investment.inviteInvestor`, `trpc.investment.agreeToTerms`
