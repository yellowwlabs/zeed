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
                  {banners.map((_: unknown, i: number) => (
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
