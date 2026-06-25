"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Eye, Edit3, Loader2, Save, FileText, CheckSquare, Square, AlertOctagon } from "lucide-react";
import { toast } from "@/lib/toast";

interface ActionItem {
  task: string;
  deadline: string;
  status: string; // pending, completed, failed
}

interface PIP {
  id: string;
  employee_id: string;
  performance_review_id?: string;
  title: string;
  reason: string;
  action_items: ActionItem[];
  start_date: string;
  end_date: string;
  status: string; // active, extended, completed, failed
  supervisor_id: string;
  outcome_notes?: string;
  employee?: { id: string; name: string; job_title?: string };
  supervisor?: { id: string; name: string };
}

export default function PerformancePipPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const [selectedPip, setSelectedPip] = useState<PIP | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form states
  const [pipStatus, setPipStatus] = useState("active");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: pips = [], isLoading } = useQuery({
    queryKey: ["performance-pips-list"],
    queryFn: async () => {
      const res = await api.get("/improvement-plans");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/improvement-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-pips-list"] });
      toast.success("Rencana PIP berhasil diperbarui");
      setShowDetailModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui rencana PIP"),
  });

  const handleOpenDetail = (pip: PIP) => {
    setSelectedPip(pip);
    setPipStatus(pip.status);
    setOutcomeNotes(pip.outcome_notes || "");
    setActionItems(pip.action_items || []);
    setShowDetailModal(true);
  };

  const handleToggleActionStatus = (index: number) => {
    const updated = [...actionItems];
    const current = updated[index].status;
    updated[index].status = current === "completed" ? "pending" : "completed";
    setActionItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPip) return;

    updateMutation.mutate({
      id: selectedPip.id,
      data: {
        title: selectedPip.title,
        reason: selectedPip.reason,
        action_items: actionItems,
        start_date: selectedPip.start_date,
        end_date: selectedPip.end_date,
        status: pipStatus,
        supervisor_id: selectedPip.supervisor_id,
        outcome_notes: outcomeNotes,
      },
    });
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Performance Improvement Plan (PIP)"
        subtitle="Pantau program pemulihan performa serta daftar tugas peningkatan keterampilan staf."
        backUrl="/performance"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Program PIP Aktif</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : pips.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
            <AlertOctagon className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Belum ada karyawan terdaftar dalam program PIP.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Karyawan</th>
                  <th className="px-4 py-3">Judul Program</th>
                  <th className="px-4 py-3">Mulai</th>
                  <th className="px-4 py-3">Selesai</th>
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                {pips.map((pip: PIP) => (
                  <tr key={pip.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{pip.employee?.name || "Unknown"}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{pip.employee?.job_title}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{pip.title}</td>
                    <td className="px-4 py-3">{pip.start_date}</td>
                    <td className="px-4 py-3">{pip.end_date}</td>
                    <td className="px-4 py-3 font-medium">{pip.supervisor?.name || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        pip.status === "completed"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                          : pip.status === "failed"
                          ? "bg-red-50 dark:bg-red-950/30 text-red-600"
                          : pip.status === "extended"
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                          : "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                      }`}>
                        {pip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(pip)}
                        className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg text-[10px] font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedPip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl animate-enter overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Rencana Peningkatan Kinerja (PIP)
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Karyawan: {selectedPip.employee?.name} • Supervisor: {selectedPip.supervisor?.name}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-zinc-500 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-850 space-y-2">
                <p className="font-extrabold text-zinc-900 dark:text-zinc-100">Alasan Program:</p>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                  {selectedPip.reason}
                </p>
              </div>

              {/* Action items checkbox list */}
              <div className="space-y-2">
                <p className="font-extrabold text-zinc-900 dark:text-zinc-100">Daftar Tindakan Perbaikan & Tugas:</p>
                <div className="space-y-2">
                  {actionItems.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleActionStatus(idx)}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/35 transition-all select-none"
                    >
                      {item.status === "completed" ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-400" />
                      )}
                      <div className="flex-1">
                        <p className={`font-bold ${item.status === "completed" ? "line-through text-zinc-400" : "text-zinc-800 dark:text-zinc-250"}`}>
                          {item.task}
                        </p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">Batas Waktu: {item.deadline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Update outcomes / status */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-900">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Status PIP</label>
                    <select
                      value={pipStatus}
                      onChange={(e) => setPipStatus(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold"
                    >
                      <option value="active">Active</option>
                      <option value="extended">Extended</option>
                      <option value="completed">Completed (Selesai/Lolos)</option>
                      <option value="failed">Failed (Gagal/PHK)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Tanggal Selesai Program</label>
                    <input
                      type="text"
                      disabled
                      value={`${selectedPip.start_date} s/d ${selectedPip.end_date}`}
                      className="w-full p-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Catatan Hasil Akhir (Outcome Notes)</label>
                  <textarea
                    value={outcomeNotes}
                    onChange={(e) => setOutcomeNotes(e.target.value)}
                    placeholder="Evaluasi akhir program PIP..."
                    rows={3}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-850 transition-colors shadow-md font-bold cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
