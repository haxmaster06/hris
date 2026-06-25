"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Plus, Calendar, Settings, Trash2, Edit3, Loader2, Save, PlayCircle, Eye } from "lucide-react";
import { toast } from "@/lib/toast";

interface Period {
  id: string;
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
}

export default function PerformancePeriodsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("quarterly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: periods = [], isLoading } = useQuery({
    queryKey: ["performance-periods-list"],
    queryFn: async () => {
      const res = await api.get("/performance-periods");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/performance-periods", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-periods-list"] });
      toast.success("Periode appraisal berhasil dibuat");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal membuat periode"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/performance-periods/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-periods-list"] });
      toast.success("Periode appraisal berhasil diperbarui");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui periode"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/performance-periods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-periods-list"] });
      toast.success("Periode appraisal berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus periode"),
  });

  const startReviewMutation = useMutation({
    mutationFn: (id: string) => api.post(`/performance-periods/${id}/start-review`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["performance-periods-list"] });
      const scaffolded = res.data?.data?.scaffolded_reviews || 0;
      toast.success(`Evaluasi dimulai! ${scaffolded} lembar penilaian berhasil dibuat.`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memulai evaluasi"),
  });

  const resetForm = () => {
    setSelectedPeriod(null);
    setName("");
    setType("quarterly");
    setStartDate("");
    setEndDate("");
    setStatus("draft");
  };

  const handleEdit = (p: Period) => {
    setSelectedPeriod(p);
    setName(p.name);
    setType(p.type);
    setStartDate(p.start_date);
    setEndDate(p.end_date);
    setStatus(p.status);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      type,
      start_date: startDate,
      end_date: endDate,
      status,
    };

    if (selectedPeriod) {
      updateMutation.mutate({ id: selectedPeriod.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Periode Evaluasi Kinerja"
        subtitle="Mulai siklus evaluasi kinerja karyawan terstruktur dan distribusikan lembar review penilaian."
        backUrl="/performance"
      />

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Daftar Siklus Periode</h2>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Periode
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : periods.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
            <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Belum ada periode penilaian dibuat.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Nama Siklus</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Mulai</th>
                  <th className="px-4 py-3">Selesai</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                {periods.map((p: Period) => (
                  <tr key={p.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                    <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{p.name}</td>
                    <td className="px-4 py-3 capitalize">{p.type.replace("_", " ")}</td>
                    <td className="px-4 py-3">{p.start_date}</td>
                    <td className="px-4 py-3">{p.end_date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        p.status === "completed" 
                          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          : p.status === "review"
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 animate-pulse"
                          : p.status === "active"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                          : "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {p.status === "draft" && (
                        <button
                          onClick={() => {
                            if (confirm(`Apakah Anda yakin ingin memulai evaluasi untuk periode ${p.name}?`)) {
                              startReviewMutation.mutate(p.id);
                            }
                          }}
                          title="Mulai Evaluasi Kinerja"
                          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg text-emerald-600 transition-colors cursor-pointer"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Apakah Anda yakin ingin menghapus periode ini?")) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal: Period CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              {selectedPeriod ? "Edit Periode Appraisal" : "Buat Periode Appraisal Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Nama Periode</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q1 2026 atau Tahunan 2026"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tipe Siklus</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="quarterly">Quarterly (3 Bulanan)</option>
                    <option value="semi_annual">Semi-Annual (6 Bulanan)</option>
                    <option value="annual">Annual (Tahunan)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Status Siklus</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="review">Review Phase</option>
                    <option value="calibration">Calibration Phase</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
