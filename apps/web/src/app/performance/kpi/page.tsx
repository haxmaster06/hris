"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Plus, Target, Users, Settings, Trash2, Edit3, Loader2, Save, Calendar, Search } from "lucide-react";
import { toast } from "@/lib/toast";

interface KPI {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  measurement_type: string;
}

interface KPIAssignment {
  id: string;
  kpi_id: string;
  employee_id: string;
  performance_period_id: string;
  target_value: number;
  actual_value?: number;
  weight: number;
  score?: number;
  notes?: string;
  kpi?: KPI;
  employee?: { id: string; name: string };
  period?: { id: string; name: string };
}

export default function KPIManagementPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"kpi" | "assignments">("kpi");

  // KPI states
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState<KPI | null>(null);
  const [kpiCode, setKpiCode] = useState("");
  const [kpiName, setKpiName] = useState("");
  const [kpiDesc, setKpiDesc] = useState("");
  const [kpiCategory, setKpiCategory] = useState("process");
  const [kpiUnit, setKpiUnit] = useState("percentage");
  const [kpiMeasureType, setKpiMeasureType] = useState("higher_better");

  // Assignment states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<KPIAssignment | null>(null);
  const [assignKpiId, setAssignKpiId] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [assignPeriodId, setAssignPeriodId] = useState("");
  const [assignTarget, setAssignTarget] = useState("");
  const [assignActual, setAssignActual] = useState("");
  const [assignWeight, setAssignWeight] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch lists
  const { data: kpis = [], isLoading: kpisLoading } = useQuery({
    queryKey: ["kpis-list"],
    queryFn: async () => {
      const res = await api.get("/kpis");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: assignments = [], isLoading: assignLoading } = useQuery({
    queryKey: ["kpi-assignments-list"],
    queryFn: async () => {
      const res = await api.get("/kpi-assignments");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["kpi-employees-list"],
    queryFn: async () => {
      const res = await api.get("/employees");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  const { data: periods = [] } = useQuery({
    queryKey: ["kpi-periods-list"],
    queryFn: async () => {
      const res = await api.get("/performance-periods");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Mutations
  const createKpi = useMutation({
    mutationFn: (data: any) => api.post("/kpis", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis-list"] });
      toast.success("KPI berhasil dibuat");
      setShowKpiModal(false);
      resetKpiForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal membuat KPI"),
  });

  const updateKpi = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/kpis/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis-list"] });
      toast.success("KPI berhasil diperbarui");
      setShowKpiModal(false);
      resetKpiForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui KPI"),
  });

  const deleteKpi = useMutation({
    mutationFn: (id: string) => api.delete(`/kpis/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpis-list"] });
      toast.success("KPI berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus KPI"),
  });

  const createAssignment = useMutation({
    mutationFn: (data: any) => api.post("/kpi-assignments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-assignments-list"] });
      toast.success("Penugasan KPI berhasil dibuat");
      setShowAssignModal(false);
      resetAssignForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal membuat penugasan KPI"),
  });

  const updateAssignment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/kpi-assignments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-assignments-list"] });
      toast.success("Penugasan KPI berhasil diperbarui");
      setShowAssignModal(false);
      resetAssignForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal memperbarui penugasan KPI"),
  });

  const deleteAssignment = useMutation({
    mutationFn: (id: string) => api.delete(`/kpi-assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kpi-assignments-list"] });
      toast.success("Penugasan KPI berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Gagal menghapus penugasan KPI"),
  });

  const resetKpiForm = () => {
    setSelectedKpi(null);
    setKpiCode("");
    setKpiName("");
    setKpiDesc("");
    setKpiCategory("process");
    setKpiUnit("percentage");
    setKpiMeasureType("higher_better");
  };

  const resetAssignForm = () => {
    setSelectedAssignment(null);
    setAssignKpiId("");
    setAssignEmployeeId("");
    setAssignPeriodId("");
    setAssignTarget("");
    setAssignActual("");
    setAssignWeight("");
    setAssignNotes("");
  };

  const handleEditKpi = (kpi: KPI) => {
    setSelectedKpi(kpi);
    setKpiCode(kpi.code);
    setKpiName(kpi.name);
    setKpiDesc(kpi.description || "");
    setKpiCategory(kpi.category);
    setKpiUnit(kpi.unit);
    setKpiMeasureType(kpi.measurement_type);
    setShowKpiModal(true);
  };

  const handleEditAssignment = (assign: KPIAssignment) => {
    setSelectedAssignment(assign);
    setAssignKpiId(assign.kpi_id);
    setAssignEmployeeId(assign.employee_id);
    setAssignPeriodId(assign.performance_period_id);
    setAssignTarget(String(assign.target_value));
    setAssignActual(assign.actual_value !== undefined && assign.actual_value !== null ? String(assign.actual_value) : "");
    setAssignWeight(String(assign.weight));
    setAssignNotes(assign.notes || "");
    setShowAssignModal(true);
  };

  const handleKpiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code: kpiCode,
      name: kpiName,
      description: kpiDesc,
      category: kpiCategory,
      unit: kpiUnit,
      measurement_type: kpiMeasureType,
      is_active: true,
    };

    if (selectedKpi) {
      updateKpi.mutate({ id: selectedKpi.id, data: payload });
    } else {
      createKpi.mutate(payload);
    }
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      target_value: Number(assignTarget),
      weight: Number(assignWeight),
      notes: assignNotes || null,
    };
    if (assignActual !== "") {
      payload.actual_value = Number(assignActual);
    }

    if (selectedAssignment) {
      updateAssignment.mutate({ id: selectedAssignment.id, data: payload });
    } else {
      createAssignment.mutate({
        ...payload,
        kpi_id: assignKpiId,
        employee_id: assignEmployeeId,
        performance_period_id: assignPeriodId,
      });
    }
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Key Performance Indicator (KPI)"
        subtitle="Daftarkan indikator performa master serta lakukan penugasan target KPI per karyawan."
        backUrl="/performance"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-900 gap-6">
          <button
            onClick={() => setActiveTab("kpi")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "kpi"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Master KPI
            {activeTab === "kpi" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("assignments")}
            className={`pb-3 text-sm font-bold transition-all duration-200 relative ${
              activeTab === "assignments"
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600"
            }`}
          >
            Penugasan Target Karyawan
            {activeTab === "assignments" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Tab 1: Master KPI */}
        {activeTab === "kpi" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Daftar Indikator KPI</h2>
              <button
                onClick={() => {
                  resetKpiForm();
                  setShowKpiModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah KPI
              </button>
            </div>

            {kpisLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : kpis.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl">
                <Target className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada KPI terdaftar.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Kode</th>
                      <th className="px-4 py-3">Nama KPI</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Satuan</th>
                      <th className="px-4 py-3">Pengukuran</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                    {kpis.map((kpi: KPI) => (
                      <tr key={kpi.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-semibold text-rose-600 dark:text-rose-400">{kpi.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-zinc-900 dark:text-zinc-50">{kpi.name}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{kpi.description}</p>
                        </td>
                        <td className="px-4 py-3 capitalize">{kpi.category}</td>
                        <td className="px-4 py-3 capitalize">{kpi.unit}</td>
                        <td className="px-4 py-3 capitalize">{kpi.measurement_type.replace("_", " ")}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditKpi(kpi)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus KPI ini?")) {
                                deleteKpi.mutate(kpi.id);
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

        {/* Tab 2: KPI Assignments */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Daftar Target Karyawan</h2>
              <button
                onClick={() => {
                  resetAssignForm();
                  setShowAssignModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Tugaskan KPI
              </button>
            </div>

            {assignLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl">
                <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">Belum ada penugasan KPI karyawan.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-3">Karyawan</th>
                      <th className="px-4 py-3">KPI</th>
                      <th className="px-4 py-3">Periode</th>
                      <th className="px-4 py-3">Bobot</th>
                      <th className="px-4 py-3">Target</th>
                      <th className="px-4 py-3">Realisasi</th>
                      <th className="px-4 py-3">Nilai</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-xs text-zinc-800 dark:text-zinc-200">
                    {assignments.map((assign: KPIAssignment) => (
                      <tr key={assign.id} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20">
                        <td className="px-4 py-3 font-bold text-zinc-950 dark:text-zinc-50">{assign.employee?.name || "Unknown"}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-rose-500 dark:text-rose-400 mr-2">[{assign.kpi?.code}]</span>
                          {assign.kpi?.name}
                        </td>
                        <td className="px-4 py-3 font-medium">{assign.period?.name || "N/A"}</td>
                        <td className="px-4 py-3">{assign.weight}%</td>
                        <td className="px-4 py-3 font-bold">{assign.target_value}</td>
                        <td className="px-4 py-3 font-semibold">{assign.actual_value !== null && assign.actual_value !== undefined ? assign.actual_value : "-"}</td>
                        <td className="px-4 py-3">
                          {assign.score !== null && assign.score !== undefined ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              assign.score >= 80 
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600" 
                                : assign.score >= 60 
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600" 
                                : "bg-red-50 dark:bg-red-950/30 text-red-600"
                            }`}>
                              {assign.score}
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleEditAssignment(assign)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus penugasan KPI ini?")) {
                                deleteAssignment.mutate(assign.id);
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

      {/* Modal 1: Master KPI CRUD */}
      {showKpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              {selectedKpi ? "Edit Master KPI" : "Tambah Master KPI"}
            </h3>
            <form onSubmit={handleKpiSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Kode KPI</label>
                  <input
                    type="text"
                    required
                    value={kpiCode}
                    onChange={(e) => setKpiCode(e.target.value)}
                    placeholder="KPI-FIN-01"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Kategori</label>
                  <select
                    value={kpiCategory}
                    onChange={(e) => setKpiCategory(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="financial">Financial</option>
                    <option value="customer">Customer</option>
                    <option value="process">Process</option>
                    <option value="learning">Learning</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Nama KPI</label>
                <input
                  type="text"
                  required
                  value={kpiName}
                  onChange={(e) => setKpiName(e.target.value)}
                  placeholder="e.g. Sales Conversion Rate"
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Deskripsi</label>
                <textarea
                  value={kpiDesc}
                  onChange={(e) => setKpiDesc(e.target.value)}
                  placeholder="Deskripsi cara menghitung KPI"
                  rows={3}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Satuan Nilai</label>
                  <select
                    value={kpiUnit}
                    onChange={(e) => setKpiUnit(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="number">Angka Nominal</option>
                    <option value="currency">Mata Uang (Rupiah)</option>
                    <option value="boolean">Ya/Tidak</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Logika Target</label>
                  <select
                    value={kpiMeasureType}
                    onChange={(e) => setKpiMeasureType(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  >
                    <option value="higher_better">Lebih Tinggi Lebih Baik</option>
                    <option value="lower_better">Lebih Rendah Lebih Baik</option>
                    <option value="target_exact">Harus Tepat Target</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKpiModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createKpi.isPending || updateKpi.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: KPI Assignment CRUD */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-xl animate-enter">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 mb-4">
              {selectedAssignment ? "Edit Penugasan KPI" : "Tugaskan KPI Karyawan"}
            </h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              {!selectedAssignment && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Pilih Karyawan</label>
                    <select
                      required
                      value={assignEmployeeId}
                      onChange={(e) => setAssignEmployeeId(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                    >
                      <option value="">-- Pilih Karyawan --</option>
                      {employees?.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Pilih KPI</label>
                    <select
                      required
                      value={assignKpiId}
                      onChange={(e) => setAssignKpiId(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                    >
                      <option value="">-- Pilih Indikator --</option>
                      {kpis?.map((kpi: any) => (
                        <option key={kpi.id} value={kpi.id}>[{kpi.code}] {kpi.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500">Pilih Periode Appraisal</label>
                    <select
                      required
                      value={assignPeriodId}
                      onChange={(e) => setAssignPeriodId(e.target.value)}
                      className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                    >
                      <option value="">-- Pilih Periode --</option>
                      {periods?.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Target Value</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={assignTarget}
                    onChange={(e) => setAssignTarget(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Bobot KPI (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={assignWeight}
                    onChange={(e) => setAssignWeight(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              {selectedAssignment && (
                <div className="space-y-1">
                  <label className="font-bold text-zinc-500">Realisasi Aktual (Opsional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={assignActual}
                    onChange={(e) => setAssignActual(e.target.value)}
                    placeholder="Masukkan pencapaian akhir"
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-rose-600 dark:text-rose-400"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-zinc-500">Catatan Target</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Catatan tambahan target..."
                  rows={2}
                  className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createAssignment.isPending || updateAssignment.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
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
