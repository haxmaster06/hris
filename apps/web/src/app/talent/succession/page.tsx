"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Plus, Grid, Save, Trash2, Edit3, Loader2, Award, UserCheck } from "lucide-react";
import { toast } from "@/lib/toast";

interface Succession {
  id: string;
  position_id: string;
  incumbent_employee_id?: string;
  candidate_employee_id: string;
  readiness_level: string; // ready_now, ready_1_year, ready_2_years, development_needed
  potential_score: number;
  performance_score: number;
  development_actions?: any;
  notes?: string;
  position?: { name: string };
  incumbent?: { name: string };
  candidate?: { name: string };
}

export default function TalentSuccessionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"board" | "list">("board");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Succession | null>(null);
  const [positionId, setPositionId] = useState("");
  const [incumbentId, setIncumbentId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [readiness, setReadiness] = useState("ready_now");
  const [potential, setPotential] = useState("");
  const [performance, setPerformance] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Lists
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["succession-plans-list"],
    queryFn: async () => {
      const res = await api.get("/succession-plans");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: gridData = {}, isLoading: gridLoading } = useQuery({
    queryKey: ["succession-nine-box-grid"],
    queryFn: async () => {
      const res = await api.get("/succession-plans/nine-box-grid");
      return res.data.data || {};
    },
    enabled: isAuthenticated,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["talent-succession-employees"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["talent-succession-positions"],
    queryFn: async () => {
      const res = await api.get("/positions");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post("/succession-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["succession-plans-list"] });
      queryClient.invalidateQueries({ queryKey: ["succession-nine-box-grid"] });
      toast.success("Kandidat suksesi berhasil ditambahkan");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menambahkan kandidat"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/succession-plans/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["succession-plans-list"] });
      queryClient.invalidateQueries({ queryKey: ["succession-nine-box-grid"] });
      toast.success("Perencanaan suksesi berhasil diperbarui");
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui suksesi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/succession-plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["succession-plans-list"] });
      queryClient.invalidateQueries({ queryKey: ["succession-nine-box-grid"] });
      toast.success("Kandidat berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus kandidat"),
  });

  const resetForm = () => {
    setSelectedPlan(null);
    setPositionId("");
    setIncumbentId("");
    setCandidateId("");
    setReadiness("ready_now");
    setPotential("");
    setPerformance("");
    setNotes("");
  };

  const handleEdit = (plan: Succession) => {
    setSelectedPlan(plan);
    setPositionId(plan.position_id);
    setIncumbentId(plan.incumbent_employee_id || "");
    setCandidateId(plan.candidate_employee_id);
    setReadiness(plan.readiness_level);
    setPotential(String(plan.potential_score));
    setPerformance(String(plan.performance_score));
    setNotes(plan.notes || "");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      position_id: positionId,
      incumbent_employee_id: incumbentId || null,
      candidate_employee_id: candidateId,
      readiness_level: readiness,
      potential_score: Number(potential),
      performance_score: Number(performance),
      notes: notes || null,
      development_actions: [],
    };

    if (selectedPlan) {
      updateMutation.mutate({ id: selectedPlan.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Succession Planning Board"
        subtitle="Analisis kesiapan kandidat suksesor kunci menggunakan peta visual 9-Box Grid."
        backUrl="/talent"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("board")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "board"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            9-Box Grid Succession Board
            {activeTab === "board" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "list"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Daftar Suksesor Pool
            {activeTab === "list" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: 9-Box Grid board */}
        {activeTab === "board" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">9-Box Talent Matrix mapping</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Suksesor
              </button>
            </div>

            {gridLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : !gridData ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <Grid className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada suksesor terdaftar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-150 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-zinc-900 shadow-sm text-xs select-none">
                {/* 9 Box Grids from top-left to bottom-right */}
                {/* Row 1: High Potential */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">Enigma</h4>
                    <p className="text-[9px] text-zinc-400">High Potential / Low Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.high_low?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">High Potential</h4>
                    <p className="text-[9px] text-zinc-400">High Potential / Med Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.high_med?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border-2 border-fuchsia-500 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase flex items-center gap-1">
                      <Award className="h-3 w-3 animate-bounce" />
                      Star
                    </h4>
                    <p className="text-[9px] text-fuchsia-700 dark:text-fuchsia-400 font-semibold">High Potential / High Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.high_high?.map((c: any) => (
                      <div key={c.id} className="bg-white dark:bg-zinc-950 p-2 rounded-xl border border-fuchsia-300 dark:border-fuchsia-900 font-bold truncate text-fuchsia-700 dark:text-fuchsia-350">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                {/* Row 2: Med Potential */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">Dilemma</h4>
                    <p className="text-[9px] text-zinc-400">Med Potential / Low Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.med_low?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">Core Player</h4>
                    <p className="text-[9px] text-zinc-400">Med Potential / Med Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.med_med?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">High Performer</h4>
                    <p className="text-[9px] text-zinc-400">Med Potential / High Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.med_high?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                {/* Row 3: Low Potential */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-red-600 uppercase">Risk</h4>
                    <p className="text-[9px] text-zinc-400">Low Potential / Low Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.low_low?.map((c: any) => (
                      <div key={c.id} className="bg-red-50/30 dark:bg-red-950/20 p-2 rounded-xl border border-red-200 dark:border-red-900 font-bold truncate text-red-600">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">Effective</h4>
                    <p className="text-[9px] text-zinc-400">Low Potential / Med Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.low_med?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-900 rounded-2xl p-4 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-[10px] text-fuchsia-600 uppercase">Solid Performer</h4>
                    <p className="text-[9px] text-zinc-400">Low Potential / High Perf</p>
                  </div>
                  <div className="mt-3 space-y-1.5 flex-1 overflow-y-auto max-h-[90px]">
                    {gridData.low_high?.map((c: any) => (
                      <div key={c.id} className="bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200/60 dark:border-zinc-850 font-bold truncate">{c.candidate_name}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Suksesor Pool Table */}
        {activeTab === "list" && (
          <div className="space-y-4 animate-enter">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Log Kandidat Suksesor</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Suksesor
              </button>
            </div>

            {plansLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-white dark:bg-zinc-950">
                <UserCheck className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada suksesor pool terdaftar.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Kandidat</th>
                      <th className="px-4 py-3">Posisi Target</th>
                      <th className="px-4 py-3">Kesiapan</th>
                      <th className="px-4 py-3">Performa Score</th>
                      <th className="px-4 py-3">Potensi Score</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                    {plans.map((p: Succession) => (
                      <tr key={p.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-bold text-zinc-900 dark:text-zinc-50">{p.candidate?.name}</td>
                        <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-450">{p.position?.name}</td>
                        <td className="px-4 py-3 capitalize">{p.readiness_level.replace("_", " ")}</td>
                        <td className="px-4 py-3 font-semibold">{p.performance_score}/100</td>
                        <td className="px-4 py-3 font-semibold">{p.potential_score}/100</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus suksesor ini?")) {
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
          </div>
        )}
      </main>

      {/* Modal: Succession Plan CRUD */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              {selectedPlan ? "Edit Kandidat Suksesor" : "Tambah Kandidat Suksesor Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Posisi Kunci Target</label>
                <select
                  required
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                >
                  <option value="">-- Pilih Posisi Kunci --</option>
                  {positions?.map((pos: any) => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Pejabat Saat Ini (Incumbent)</label>
                  <select
                    value={incumbentId}
                    onChange={(e) => setIncumbentId(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  >
                    <option value="">-- Pilih Incumbent (Opsional) --</option>
                    {employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Kandidat Penerus</label>
                  <select
                    required
                    value={candidateId}
                    onChange={(e) => setCandidateId(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  >
                    <option value="">-- Pilih Penerus --</option>
                    {employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Tingkat Kesiapan (Readiness)</label>
                <select
                  value={readiness}
                  onChange={(e) => setReadiness(e.target.value)}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-rose-600"
                >
                  <option value="ready_now">Ready Now (Siap Sekarang)</option>
                  <option value="ready_1_year">Ready in 1 Year (Siap 1 Tahun)</option>
                  <option value="ready_2_years">Ready in 2 Years (Siap 2 Tahun)</option>
                  <option value="development_needed">Development Needed (Butuh Pembinaan)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Nilai Performa (0 - 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={performance}
                    onChange={(e) => setPerformance(e.target.value)}
                    placeholder="e.g. 85"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Nilai Potensi (0 - 100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={potential}
                    onChange={(e) => setPotential(e.target.value)}
                    placeholder="e.g. 90"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Catatan Suksesi</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan panel promosi..."
                  rows={2}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none font-medium"
                />
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
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan Suksesor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
