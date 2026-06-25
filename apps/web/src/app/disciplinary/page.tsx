"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Plus, ShieldAlert, Users, Search, Loader2, Save, FileText, ChevronRight, Eye } from "lucide-react";
import { toast } from "@/lib/toast";
import Link from "next/link";

interface DisciplinaryCase {
  id: string;
  employee_id: string;
  case_number: string;
  category: string;
  incident_date: string;
  description: string;
  evidence?: any;
  severity: string;
  status: string;
  reported_by: string;
  employee?: { id: string; name: string; job_title?: string };
  reporter?: { id: string; name: string };
}

export default function DisciplinaryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [category, setCategory] = useState("conduct");
  const [incidentDate, setIncidentDate] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [reportedBy, setReportedBy] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["disciplinary-cases-list"],
    queryFn: async () => {
      const res = await api.get("/disciplinary-cases");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["disciplinary-employees-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/disciplinary-cases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disciplinary-cases-list"] });
      toast.success("Kasus kedisiplinan berhasil dilaporkan");
      setShowAddModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal melaporkan kasus"),
  });

  const resetForm = () => {
    setEmployeeId("");
    setCategory("conduct");
    setIncidentDate("");
    setDescription("");
    setSeverity("minor");
    setReportedBy("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employee_id: employeeId,
      category,
      incident_date: incidentDate,
      description,
      severity,
      reported_by: reportedBy,
    });
  };

  if (!mounted || !isAuthenticated) return null;

  const totalCases = Array.isArray(cases) ? cases.length : 0;
  const underInvestigation = Array.isArray(cases) ? cases.filter((c: any) => c.status === "under_investigation").length : 0;
  const activeWarnings = Array.isArray(cases) ? cases.filter((c: any) => c.status === "decided").length : 0;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Kedisiplinan (Disciplinary Cases)"
        subtitle="Kelola laporan pelanggaran tata tertib, logs berkas berita acara (BAP), dan penerbitan surat peringatan (SP)."
        backUrl="/dashboard"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Kasus Masuk</span>
              <ShieldAlert className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{totalCases}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Dalam Investigasi</span>
              <Users className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{underInvestigation}</p>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-5 shadow-sm select-none">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Kasus Selesai / Terbit Sanksi</span>
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{activeWarnings}</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Log Pelanggaran Karyawan</h2>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Laporkan Kasus
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
            <ShieldAlert className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Tidak ada kasus kedisiplinan yang tercatat.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">No. Kasus</th>
                  <th className="px-4 py-3">Karyawan Terkait</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Tgl Insiden</th>
                  <th className="px-4 py-3">Tingkat</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                {cases.map((c: DisciplinaryCase) => (
                  <tr key={c.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                    <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{c.case_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{c.employee?.name || "Unknown"}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{c.employee?.job_title}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{c.category.replace("_", " ")}</td>
                    <td className="px-4 py-3">{c.incident_date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        c.severity === "critical" || c.severity === "major"
                          ? "bg-red-50 dark:bg-red-950/30 text-red-600"
                          : c.severity === "moderate"
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                          : "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                      }`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        c.status === "closed"
                          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          : c.status === "decided"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 animate-pulse"
                      }`}>
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/disciplinary/cases/${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg text-[10px] font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal: Report Case */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              Laporkan Pelanggaran Tata Tertib
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Karyawan Terlapor</label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees?.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Kategori Pelanggaran</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="attendance">Ketidakhadiran (Attendance)</option>
                    <option value="conduct">Sikap & Perilaku (Conduct)</option>
                    <option value="performance">Performa Kerja (Performance)</option>
                    <option value="policy_violation">Pelanggaran Kebijakan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tingkat Keparahan</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="minor">Minor (Ringan)</option>
                    <option value="moderate">Moderate (Sedang)</option>
                    <option value="major">Major (Berat)</option>
                    <option value="critical">Critical (Sangat Berat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tanggal Kejadian</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Dilaporkan Oleh</label>
                  <select
                    required
                    value={reportedBy}
                    onChange={(e) => setReportedBy(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  >
                    <option value="">-- Pilih Pelapor --</option>
                    {employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Keterangan / Rincian Insiden</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail kronologi pelanggaran..."
                  rows={4}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
