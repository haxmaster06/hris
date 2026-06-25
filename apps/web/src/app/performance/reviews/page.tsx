"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Eye, Edit3, Loader2, Save, User, ShieldAlert, Award, FileText, CheckCircle } from "lucide-react";
import { toast } from "@/lib/toast";

interface Review {
  id: string;
  performance_period_id: string;
  employee_id: string;
  kpi_score?: number;
  self_score?: number;
  self_comment?: string;
  manager_score?: number;
  manager_comment?: string;
  manager_id?: string;
  hr_score?: number;
  hr_comment?: string;
  hr_reviewer_id?: string;
  final_score?: number;
  rating?: string;
  status: string;
  employee?: { id: string; name: string; job_title?: string };
  period?: { id: string; name: string };
  manager?: { id: string; name: string };
}

export default function PerformanceReviewsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form states
  const [scoreType, setScoreType] = useState<"self" | "manager" | "hr">("self");
  const [inputScore, setInputScore] = useState("");
  const [inputComment, setInputComment] = useState("");
  const [hrFinalScore, setHrFinalScore] = useState("");
  const [hrRating, setHrRating] = useState("meets");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["performance-reviews-list"],
    queryFn: async () => {
      const res = await api.get("/performance-reviews");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["review-employees-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Mutations
  const selfReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/performance-reviews/${id}/self-review`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews-list"] });
      toast.success("Self-review berhasil disimpan");
      setShowDetailModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan self-review"),
  });

  const managerReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/performance-reviews/${id}/manager-review`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews-list"] });
      toast.success("Manager review berhasil disimpan");
      setShowDetailModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menyimpan manager review"),
  });

  const hrReviewMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.post(`/performance-reviews/${id}/hr-review`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-reviews-list"] });
      toast.success("Penilaian HR & Kalibrasi berhasil diselesaikan");
      setShowDetailModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memproses penilaian HR"),
  });

  const handleOpenDetail = (rev: Review) => {
    setSelectedReview(rev);
    setInputScore("");
    setInputComment("");
    setHrFinalScore(String(rev.final_score || ""));
    setHrRating(rev.rating || "meets");
    setShowDetailModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    if (scoreType === "self") {
      selfReviewMutation.mutate({
        id: selectedReview.id,
        data: {
          self_score: Number(inputScore),
          self_comment: inputComment,
        },
      });
    } else if (scoreType === "manager") {
      // Find current logged-in employee ID or select the first employee as fallback
      const managerId = employees && employees.length > 0 ? employees[0].id : "";
      managerReviewMutation.mutate({
        id: selectedReview.id,
        data: {
          manager_score: Number(inputScore),
          manager_comment: inputComment,
          manager_id: managerId,
        },
      });
    } else if (scoreType === "hr") {
      const hrReviewerId = employees && employees.length > 0 ? employees[0].id : "";
      hrReviewMutation.mutate({
        id: selectedReview.id,
        data: {
          hr_score: Number(inputScore),
          hr_comment: inputComment,
          hr_reviewer_id: hrReviewerId,
          final_score: Number(hrFinalScore),
          rating: hrRating,
          status: "completed",
        },
      });
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Penilaian Kinerja (Appraisals)"
        subtitle="Pantau lembar evaluasi kinerja mandiri staf, ulasan penilaian atasan, hingga tahap kalibrasi akhir."
        backUrl="/performance"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-4">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Lembar Penilaian Karyawan</h2>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
            <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Belum ada lembar evaluasi kinerja aktif.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">Karyawan</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Self</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Final</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                {reviews.map((rev: Review) => (
                  <tr key={rev.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                    <td className="px-4 py-3">
                      <p className="font-bold text-zinc-900 dark:text-zinc-50">{rev.employee?.name || "Unknown"}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{rev.employee?.job_title}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{rev.period?.name || "N/A"}</td>
                    <td className="px-4 py-3 font-medium">{rev.self_score !== null && rev.self_score !== undefined ? rev.self_score : "-"}</td>
                    <td className="px-4 py-3 font-medium">{rev.manager_score !== null && rev.manager_score !== undefined ? rev.manager_score : "-"}</td>
                    <td className="px-4 py-3">
                      {rev.final_score !== null && rev.final_score !== undefined ? (
                        <span className="font-extrabold text-rose-600 dark:text-rose-400">{rev.final_score}</span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rev.rating ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          rev.rating === "exceptional" || rev.rating === "exceeds"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                            : rev.rating === "meets"
                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                            : "bg-red-50 dark:bg-red-950/30 text-red-600"
                        }`}>
                          {rev.rating}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                        rev.status === "completed"
                          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          : "bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                      }`}>
                        {rev.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenDetail(rev)}
                        className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 rounded-lg text-[10px] font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" />
                        Tinjau
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail & Review Modal */}
      {showDetailModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-6 shadow-2xl animate-enter overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                  Ulasan Evaluasi: {selectedReview.employee?.name}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Periode: {selectedReview.period?.name} • Status Alur: {selectedReview.status.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-zinc-500 text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Score History Details */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-850">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 block">Self-Review</span>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                  {selectedReview.self_score !== null && selectedReview.self_score !== undefined ? `${selectedReview.self_score}/100` : "-"}
                </p>
                <p className="text-[9px] text-zinc-400 italic leading-tight truncate">{selectedReview.self_comment || "Tidak ada komentar"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 block">Manager Score</span>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">
                  {selectedReview.manager_score !== null && selectedReview.manager_score !== undefined ? `${selectedReview.manager_score}/100` : "-"}
                </p>
                <p className="text-[9px] text-zinc-400 italic leading-tight truncate">{selectedReview.manager_comment || "Tidak ada komentar"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 block">Calculated KPI</span>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                  {selectedReview.kpi_score !== null && selectedReview.kpi_score !== undefined ? `${selectedReview.kpi_score}/100` : "-"}
                </p>
                <p className="text-[9px] text-zinc-400 leading-tight">Dihitung otomatis</p>
              </div>
            </div>

            {/* Submit Scores Forms based on State */}
            {selectedReview.status !== "completed" && (
              <form onSubmit={handleFormSubmit} className="space-y-4 border-t border-zinc-200/60 dark:border-zinc-900 pt-4 text-xs">
                <div className="flex gap-4 mb-2">
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-50">Kirim Penilaian Tambahan:</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="scoreType"
                        checked={scoreType === "self"}
                        onChange={() => setScoreType("self")}
                      />
                      Self-Review
                    </label>
                    <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="scoreType"
                        checked={scoreType === "manager"}
                        onChange={() => setScoreType("manager")}
                      />
                      Manager Review
                    </label>
                    <label className="flex items-center gap-1 text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="scoreType"
                        checked={scoreType === "hr"}
                        onChange={() => setScoreType("hr")}
                      />
                      HR Calibration
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Nilai Ulasan (0 - 100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={inputScore}
                      onChange={(e) => setInputScore(e.target.value)}
                      placeholder="e.g. 85"
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold"
                    />
                  </div>

                  {scoreType === "hr" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500">Nilai Akhir</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={hrFinalScore}
                          onChange={(e) => setHrFinalScore(e.target.value)}
                          placeholder="e.g. 80"
                          className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-black text-rose-600 dark:text-rose-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500">Kategori Rating</label>
                        <select
                          value={hrRating}
                          onChange={(e) => setHrRating(e.target.value)}
                          className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold"
                        >
                          <option value="exceptional">Exceptional</option>
                          <option value="exceeds">Exceeds</option>
                          <option value="meets">Meets</option>
                          <option value="below">Below</option>
                          <option value="unsatisfactory">Unsatisfactory</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Catatan/Komentar Evaluasi</label>
                  <textarea
                    required
                    value={inputComment}
                    onChange={(e) => setInputComment(e.target.value)}
                    placeholder="Tulis umpan balik konstruktif..."
                    rows={3}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={selfReviewMutation.isPending || managerReviewMutation.isPending || hrReviewMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-850 transition-colors shadow-md font-bold cursor-pointer animate-pulse"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Kirim Penilaian
                  </button>
                </div>
              </form>
            )}

            {selectedReview.status === "completed" && (
              <div className="border-t border-zinc-200/60 dark:border-zinc-900 pt-4">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 p-4 rounded-2xl flex items-start gap-3">
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Hasil Penilaian Akhir Kalibrasi</h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                      Nilai Akhir: <strong className="text-sm font-black">{selectedReview.final_score}</strong> • Kategori Rating: <strong className="capitalize">{selectedReview.rating}</strong>
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed italic">
                      Catatan HR: &quot;{selectedReview.hr_comment || "Tidak ada catatan tambahan"}&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
