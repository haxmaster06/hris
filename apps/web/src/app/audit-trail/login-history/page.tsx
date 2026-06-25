"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Loader2, Search, Calendar, ShieldAlert, Monitor, ShieldCheck, AlertCircle, RefreshCw, Eye
} from "lucide-react";

interface LoginHistory {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
  } | null;
  ip_address: string;
  device: string | null;
  browser: string | null;
  os: string | null;
  location: string | null;
  status: "success" | "failed" | "locked";
  login_at: string;
  logout_at: string | null;
  is_new_device: boolean;
}

export default function LoginHistoryPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setMounted(true);
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Fetch Login Histories
  const { data, isLoading, error, refetch } = useQuery<{ data: LoginHistory[] }>({
    queryKey: ["login-histories-list", search, status, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const res = await api.get("/login-histories", { params });
      return res.data?.data || res.data;
    },
    enabled: isAuthenticated && mounted,
  });

  const histories = data?.data || [];

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setStartDate("");
    setEndDate("");
  };

  const getStatusBadge = (stat: string) => {
    switch (stat) {
      case "success": 
        return (
          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900 text-[9px] font-black uppercase flex items-center gap-1 w-fit">
            <ShieldCheck className="h-3 w-3" /> Success
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded-lg bg-red-50 text-red-700 border border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 text-[9px] font-black uppercase flex items-center gap-1 w-fit">
            <ShieldAlert className="h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-lg bg-zinc-550 text-zinc-700 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 text-[9px] font-black uppercase flex items-center gap-1 w-fit">
            Locked
          </span>
        );
    }
  };

  if (!mounted || !hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/85 bg-white/80 dark:border-zinc-900 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/audit-trail")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Riwayat Login Pengguna</h1>
              <p className="text-[10px] text-zinc-500">Monitoring sesi aktif, alamat IP, dan deteksi perangkat baru.</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* Filters Top Bar */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-zinc-500">Pencarian User / IP / Browser</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari user, ip, device..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-zinc-500">Status Login</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
            >
              <option value="">Semua Status</option>
              <option value="success">Success (Berhasil)</option>
              <option value="failed">Failed (Gagal)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-zinc-500">Rentang Tanggal</label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
              />
              <span className="text-[10px] text-zinc-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-black hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
          >
            Reset Filter
          </button>
        </div>

        {/* Table Content */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-xs font-semibold">Gagal memuat riwayat login.</p>
            </div>
          ) : histories.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 space-y-2">
              <Monitor className="h-8 w-8 mx-auto" />
              <p className="text-xs">Tidak ditemukan riwayat login.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-550">
                    <th className="py-3 font-black uppercase text-[10px]">Waktu Login</th>
                    <th className="py-3 font-black uppercase text-[10px]">Pengguna</th>
                    <th className="py-3 font-black uppercase text-[10px]">Alamat IP</th>
                    <th className="py-3 font-black uppercase text-[10px]">Lokasi</th>
                    <th className="py-3 font-black uppercase text-[10px]">Perangkat / OS</th>
                    <th className="py-3 font-black uppercase text-[10px]">Browser</th>
                    <th className="py-3 font-black uppercase text-[10px]">Status</th>
                    <th className="py-3 font-black uppercase text-[10px]">Waktu Logout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                  {histories.map((h) => (
                    <tr key={h.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 font-semibold text-zinc-950 dark:text-zinc-50 whitespace-nowrap">
                        {new Date(h.login_at).toLocaleString("id-ID")}
                      </td>
                      <td className="py-3 text-zinc-950 dark:text-zinc-50">
                        <div className="font-bold">{h.user?.name || "Unknown User"}</div>
                        <div className="text-[10px] text-zinc-500">{h.user?.email || ""}</div>
                      </td>
                      <td className="py-3 font-mono text-zinc-650 dark:text-zinc-400 whitespace-nowrap">{h.ip_address}</td>
                      <td className="py-3 text-zinc-650 dark:text-zinc-400 whitespace-nowrap">{h.location || "Local Dev"}</td>
                      <td className="py-3 text-zinc-650 dark:text-zinc-400 whitespace-nowrap">
                        <span className="font-semibold text-zinc-950 dark:text-zinc-50">{h.device || "Desktop"}</span>
                        <span className="text-[10px] text-zinc-500 ml-1">({h.os || "Unknown"})</span>
                      </td>
                      <td className="py-3 text-zinc-650 dark:text-zinc-400 whitespace-nowrap">
                        {h.browser || "N/A"}
                        {h.is_new_device && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-705 border border-amber-200 text-[8px] font-black uppercase">
                            Perangkat Baru
                          </span>
                        )}
                      </td>
                      <td className="py-3">{getStatusBadge(h.status)}</td>
                      <td className="py-3 text-zinc-500 whitespace-nowrap">
                        {h.logout_at ? new Date(h.logout_at).toLocaleString("id-ID") : <span className="italic text-zinc-405">Aktif / No Logout</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
