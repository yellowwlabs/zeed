"use client";

import React, { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Plus, Trash2, Edit3, ToggleLeft, ToggleRight,
  Users, Megaphone, ArrowLeft
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [tab, setTab] = useState<"banners" | "users">("banners");

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
