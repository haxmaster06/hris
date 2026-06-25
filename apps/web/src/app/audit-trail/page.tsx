"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { 
  ArrowLeft, Loader2, Search, Calendar, Filter, Database, Eye, ShieldAlert, AlertCircle, RefreshCw, Smartphone
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: "created" | "updated" | "deleted" | "restored" | "force_deleted";
  auditable_type: string;
  auditable_id: string;
  auditable_label: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  module: string | null;
  created_at: string;
}

export default function AuditTrailPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setMounted(true);
    if (hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, hasHydrated, router]);

  // Fetch Audit Logs
  const { data, isLoading, error, refetch } = useQuery<{ data: AuditLog[] }>({
    queryKey: ["audit-logs-list", search, action, module, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (action) params.action = action;
      if (module) params.module = module;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const res = await api.get("/audit-logs", { params });
      return res.data?.data || res.data;
    },
    enabled: isAuthenticated && mounted,
  });

  const logs = data?.data || [];

  const handleResetFilters = () => {
    setSearch("");
    setAction("");
    setModule("");
    setStartDate("");
    setEndDate("");
  };

  const getActionBadgeClass = (act: string) => {
    switch (act) {
      case "created": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900";
      case "updated": return "bg-amber-50 text-amber-705 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900";
      case "deleted": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900";
      default: return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-400 dark:border-zinc-800";
    }
  };

  const cleanClassName = (cls: string) => {
    const parts = cls.split("\\");
    return parts[parts.length - 1];
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
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl transition-colors cursor-pointer text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">Audit Trail Viewer</h1>
              <p className="text-[10px] text-zinc-500">Pelacakan log perubahan data (SIEM / Audit Compliance).</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/audit-trail/login-history")}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-550 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Smartphone className="h-3.5 w-3.5" /> Riwayat Login
            </button>
            <button
              onClick={() => refetch()}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column: Filter Sidebar */}
          <div className="lg:col-span-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm space-y-4 h-fit">
            <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter Log
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Pencarian Kata Kunci</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Nama, Label, Tipe..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Aksi Perubahan</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
                >
                  <option value="">Semua Aksi</option>
                  <option value="created">Created (Baru)</option>
                  <option value="updated">Updated (Modifikasi)</option>
                  <option value="deleted">Deleted (Hapus)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Modul Kerja</label>
                <select
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
                >
                  <option value="">Semua Modul</option>
                  <option value="Employee">Employee (Karyawan)</option>
                  <option value="Leave">Leave (Cuti)</option>
                  <option value="Payroll">Payroll (Gaji)</option>
                  <option value="Compensation">Compensation</option>
                  <option value="Recruitment">Recruitment</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-500">Tanggal Selesai</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-900 bg-transparent text-xs text-zinc-950 dark:text-zinc-50 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <button
                onClick={handleResetFilters}
                className="w-full py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-black hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                Reset Filter
              </button>
            </div>
          </div>

          {/* Right Column: Logs List & Diff Viewer */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Table / List */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-5 shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-xs font-semibold">Gagal memuat log audit.</p>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-20 text-center text-zinc-400 space-y-2">
                  <Database className="h-8 w-8 mx-auto" />
                  <p className="text-xs">Tidak ditemukan log audit yang cocok dengan filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-zinc-900 text-zinc-550">
                        <th className="py-3 font-black uppercase text-[10px]">Waktu</th>
                        <th className="py-3 font-black uppercase text-[10px]">Pengubah</th>
                        <th className="py-3 font-black uppercase text-[10px]">Aksi</th>
                        <th className="py-3 font-black uppercase text-[10px]">Tipe Data</th>
                        <th className="py-3 font-black uppercase text-[10px]">Nama Data / Label</th>
                        <th className="py-3 font-black uppercase text-[10px] text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 font-medium text-zinc-950 dark:text-zinc-50 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 text-zinc-650 dark:text-zinc-400">{log.user_name || "System"}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 text-zinc-500 whitespace-nowrap">{cleanClassName(log.auditable_type)}</td>
                          <td className="py-3 font-semibold text-zinc-950 dark:text-zinc-50">{log.auditable_label || "-"}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 rounded-lg cursor-pointer transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* JSON Diff Viewer Panel */}
            {selectedLog && (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-md space-y-4 animate-slide-up">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-100 dark:border-zinc-900">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-500" /> Detail Perubahan Data
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      ID Log: {selectedLog.id} | IP: {selectedLog.ip_address || "N/A"}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-xs text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 font-bold hover:underline cursor-pointer"
                  >
                    Tutup Panel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Values */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded w-fit">
                      Nilai Lama (Sebelum)
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 font-mono text-[10px] max-h-60 overflow-y-auto">
                      {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 ? (
                        <pre className="text-red-700 dark:text-red-400">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-zinc-400 italic">Tidak ada data (Baru Dibuat / Kosong).</span>
                      )}
                    </div>
                  </div>

                  {/* New Values */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded w-fit">
                      Nilai Baru (Sesudah)
                    </h4>
                    <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 font-mono text-[10px] max-h-60 overflow-y-auto">
                      {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 ? (
                        <pre className="text-emerald-700 dark:text-emerald-400">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-zinc-400 italic">Tidak ada data (Dihapus / Kosong).</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Agent */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 space-y-1">
                  <h4 className="text-[10px] font-bold text-zinc-500">Perangkat / User Agent</h4>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-mono">
                    {selectedLog.user_agent || "N/A"}
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
