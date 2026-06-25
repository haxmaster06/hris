"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import Header from "@/components/Header";
import { Play, Check, Lock, Loader2, Eye, Plus, ArrowLeft, Calendar, FileText, Download } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "draft" | "approved" | "locked";
  payroll_runs_count?: number;
}

export default function PayrollPeriodsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [periodDetails, setPeriodDetails] = useState<any[] | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [exportPending, setExportPending] = useState<boolean>(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const getMonthLastDay = (m: number, y: number) => {
    return new Date(y, m, 0).getDate();
  };

  const formatTwoDigits = (num: number) => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  const [formData, setFormData] = useState({
    month: currentMonth,
    year: currentYear,
    name: `${monthNames[currentMonth - 1]} ${currentYear}`,
    start_date: `${currentYear}-${formatTwoDigits(currentMonth)}-01`,
    end_date: `${currentYear}-${formatTwoDigits(currentMonth)}-${formatTwoDigits(getMonthLastDay(currentMonth, currentYear))}`,
    cut_off_date: `${currentYear}-${formatTwoDigits(currentMonth)}-25`,
    payment_date: `${currentYear}-${formatTwoDigits(currentMonth)}-28`,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMonthYearChange = (updatedMonth: number, updatedYear: number) => {
    const lastDay = getMonthLastDay(updatedMonth, updatedYear);
    const monthStr = formatTwoDigits(updatedMonth);
    setFormData({
      ...formData,
      month: updatedMonth,
      year: updatedYear,
      name: `${monthNames[updatedMonth - 1]} ${updatedYear}`,
      start_date: `${updatedYear}-${monthStr}-01`,
      end_date: `${updatedYear}-${monthStr}-${formatTwoDigits(lastDay)}`,
      cut_off_date: `${updatedYear}-${monthStr}-25`,
      payment_date: `${updatedYear}-${monthStr}-28`,
    });
  };

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Fetch Periods
  const { data: periods, isLoading } = useQuery({
    queryKey: ["payroll-periods-list"],
    queryFn: async () => {
      const res = await api.get("/payroll-periods");
      return res.data.data?.data || res.data.data || [];
    },
    enabled: isAuthenticated,
  });

  // Create Period Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/payroll-periods", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods-list"] });
      toast.success("Periode penggajian baru berhasil dibuat.");
      setIsModalOpen(false);
      setIsSubmitting(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal membuat periode.");
      setIsSubmitting(false);
    },
  });

  // Calculate Period Mutation
  const calculateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/payroll-periods/${id}/calculate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods-list"] });
      toast.success("Kalkulasi batch payroll periode ini selesai dijalankan.");
      if (selectedPeriod) {
        handleViewDetails(selectedPeriod);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal melakukan kalkulasi penggajian.");
    },
  });

  // Approve Period Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/payroll-periods/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods-list"] });
      toast.success("Status periode disetujui (Approved). Siap untuk dikunci.");
      if (selectedPeriod) {
        handleViewDetails({ ...selectedPeriod, status: "approved" });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal menyetujui periode penggajian.");
    },
  });

  // Lock Period Mutation
  const lockMutation = useMutation({
    mutationFn: (id: string) => api.post(`/payroll-periods/${id}/lock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-periods-list"] });
      toast.success("Periode penggajian berhasil dikunci (Locked). Slip gaji resmi diterbitkan.");
      if (selectedPeriod) {
        handleViewDetails({ ...selectedPeriod, status: "locked" });
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Gagal mengunci periode penggajian.");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    createMutation.mutate(formData);
  };

  const handleCalculate = async (period: PayrollPeriod) => {
    const confirmRes = await Swal.fire({
      title: "Kalkulasi Gaji Periode",
      text: `Mulai jalankan kalkulasi gaji, tunjangan, cicilan kasbon, potongan BPJS, dan PPh 21 TER untuk seluruh karyawan aktif di periode "${period.name}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Kalkulasi",
      cancelButtonText: "Batal",
      confirmButtonColor: "#3b82f6",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      toast.info("Memproses kalkulasi batch...");
      calculateMutation.mutate(period.id);
    }
  };

  const handleApprove = async (period: PayrollPeriod) => {
    const confirmRes = await Swal.fire({
      title: "Setujui Periode Gaji",
      text: `Apakah Anda yakin ingin menyetujui payroll untuk "${period.name}"? Tindakan ini akan mengunci perhitungan sementara sebelum finalisasi transfer bank.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      approveMutation.mutate(period.id);
    }
  };

  const handleLock = async (period: PayrollPeriod) => {
    const confirmRes = await Swal.fire({
      title: "Kunci Periode Gaji (Final)",
      text: `Kunci periode "${period.name}"? Tindakan ini bersifat PERMANEN. Seluruh nominal akan di-lock, limit pinjaman kasbon terpotong, dan slip gaji resmi diterbitkan ke ESS karyawan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Kunci Permanen",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      background: document.documentElement.classList.contains("dark") ? "#18181b" : "#fff",
      color: document.documentElement.classList.contains("dark") ? "#fff" : "#000",
    });

    if (confirmRes.isConfirmed) {
      lockMutation.mutate(period.id);
    }
  };

  const handleBankExport = async (periodId: string) => {
    if (!selectedBank) return;
    try {
      setExportPending(true);
      const response = await api.post("/integration/bank-export", {
        payroll_period_id: periodId,
        bank: selectedBank,
      });

      if (response.data.success) {
        const { filename, content } = response.data.data;
        // Decode base64 content
        const byteCharacters = atob(content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/octet-stream" });

        // Download via temporary anchor element
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("File transfer bank berhasil diunduh.");
      } else {
        toast.error("Gagal melakukan ekspor data bank.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Terjadi kesalahan saat memproses ekspor.");
    } finally {
      setExportPending(false);
    }
  };

  const handleViewDetails = async (period: PayrollPeriod) => {
    setSelectedPeriod(period);
    setPeriodDetails(null);
    setSelectedBank("");
    try {
      const res = await api.get(`/payroll-runs?payroll_period_id=${period.id}&include=employee`);
      setPeriodDetails(res.data.data?.data || res.data.data || []);
    } catch (e) {
      toast.error("Gagal mengambil detail rincian payroll berjalan.");
    }
  };

  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);
  };

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans pb-16">
      <Header
        title="Proses & Periode Gaji"
        subtitle="Kelola siklus bulanan penggajian, kalkulasi, persetujuan direksi, dan finalisasi slip gaji."
        backUrl="/payroll"
      />

      <main className="max-w-6xl mx-auto px-6 mt-8 space-y-8 animate-enter">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Period List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50">Daftar Periode</h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="p-1.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" /> Baru
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
                            ) : (periods || []).length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Belum ada periode dibuat.</p>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {(periods || []).map((p: PayrollPeriod) => (
                    <div
                      key={p.id}
                      onClick={() => handleViewDetails(p)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                        selectedPeriod?.id === p.id
                          ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-700"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50">{p.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          p.status === "locked"
                            ? "bg-red-50 text-red-750 dark:bg-red-950/20 dark:text-red-400"
                            : p.status === "approved"
                            ? "bg-emerald-50 text-emerald-705 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-705 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{p.start_date} s/d {p.end_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Period Calculation & Detail */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-zinc-950 p-6 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-sm space-y-6">
              {selectedPeriod ? (
                <>
                  {/* Period Info Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-900">
                    <div>
                      <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50">{selectedPeriod.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1">Siklus: {selectedPeriod.start_date} hingga {selectedPeriod.end_date}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* Calculate Button */}
                      {selectedPeriod.status === "draft" && (
                        <button
                          onClick={() => handleCalculate(selectedPeriod)}
                          disabled={calculateMutation.isPending}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-blue-650 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {calculateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                          Kalkulasi
                        </button>
                      )}

                      {/* Approve Button */}
                      {selectedPeriod.status === "draft" && (
                        <button
                          onClick={() => handleApprove(selectedPeriod)}
                          disabled={approveMutation.isPending}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          Setujui
                        </button>
                      )}

                      {/* Lock Button */}
                      {selectedPeriod.status === "approved" && (
                        <button
                          onClick={() => handleLock(selectedPeriod)}
                          disabled={lockMutation.isPending}
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-650 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                        >
                          {lockMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                          Kunci Periode
                        </button>
                      )}

                      {/* Bank Export */}
                      {selectedPeriod.status === "locked" && (
                        <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 bg-zinc-50 dark:bg-zinc-900/50">
                          <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="bg-transparent text-xs outline-none py-1 px-2 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">-- Pilih Bank --</option>
                            <option value="bca" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">BCA (CSV)</option>
                            <option value="mandiri" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Mandiri (Fixed Width)</option>
                            <option value="bri" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">BRI (Text)</option>
                            <option value="bni" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">BNI (CSV)</option>
                          </select>
                          <button
                            onClick={() => handleBankExport(selectedPeriod.id)}
                            disabled={!selectedBank || exportPending}
                            className="inline-flex items-center gap-1 py-1 px-3 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-40 cursor-pointer"
                          >
                            {exportPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            Ekspor
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payroll Run Details */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-zinc-950 dark:text-zinc-50 uppercase tracking-wider">Rincian Perhitungan Karyawan</h4>
                    {periodDetails === null ? (
                      <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                      </div>
                    ) : periodDetails.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 select-none">
                        <p className="text-zinc-550 text-xs">Belum ada rincian payroll. Jalankan kalkulasi terlebih dahulu.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-900 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-900">
                            <tr>
                              <th className="px-4 py-2.5">Karyawan</th>
                              <th className="px-4 py-2.5">Pendapatan Gross</th>
                              <th className="px-4 py-2.5">Potongan / BPJS</th>
                              <th className="px-4 py-2.5">Pajak PPh 21</th>
                              <th className="px-4 py-2.5">Gaji Bersih (Net)</th>
                              <th className="px-4 py-2.5 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                            {periodDetails.map((run: any) => {
                              const empName = run.employee ? `${run.employee.first_name} ${run.employee.last_name || ""}` : "N/A";
                              return (
                                <tr key={run.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10">
                                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">{empName}</td>
                                  <td className="px-4 py-3 font-mono text-zinc-600 dark:text-zinc-350">{formatCurrency(run.gross_salary)}</td>
                                  <td className="px-4 py-3 font-mono text-red-650 dark:text-red-400">-{formatCurrency(Number(run.total_deductions) + Number(run.bpjs_employee_allowance || 0))}</td>
                                  <td className="px-4 py-3 font-mono text-red-650 dark:text-red-400">-{formatCurrency(run.tax_amount)}</td>
                                  <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-450">{formatCurrency(run.net_salary)}</td>
                                  <td className="px-4 py-3 text-right">
                                    <Link
                                      href={`/payroll/payslip/${run.employee_id}?period_id=${selectedPeriod.id}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-[10px] font-bold text-zinc-600 dark:text-zinc-400"
                                    >
                                      <FileText className="h-3 w-3" /> Slip Gaji
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col justify-center items-center py-24 text-center border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 select-none">
                  <Calendar className="h-10 w-10 text-zinc-400 dark:text-zinc-600 mb-3" />
                  <p className="text-zinc-500 text-sm">Pilih salah satu periode di kolom sebelah kiri untuk mengelola kalkulasi atau melihat rincian.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Period Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleCreate}
              className="w-full max-w-lg bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
                <h3 className="text-base font-bold text-zinc-955 dark:text-zinc-50 font-sans">Buat Periode Baru</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 text-lg cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                {/* Month and Year selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Bulan</label>
                    <select
                      value={formData.month}
                      onChange={(e) => handleMonthYearChange(Number(e.target.value), formData.year)}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                    >
                      {monthNames.map((name, index) => (
                        <option key={index + 1} value={index + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tahun</label>
                    <select
                      value={formData.year}
                      onChange={(e) => handleMonthYearChange(formData.month, Number(e.target.value))}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                    >
                      {Array.from({ length: 10 }, (_, i) => currentYear - 2 + i).map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Nama Periode</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Gaji Juni 2026"
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-950 dark:text-zinc-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Cut-Off</label>
                    <input
                      type="date"
                      required
                      value={formData.cut_off_date}
                      onChange={(e) => setFormData({ ...formData, cut_off_date: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tanggal Pembayaran</label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                      className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Catatan (Opsional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan untuk periode penggajian ini..."
                    rows={2}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsSubmitting(false);
                  }}
                  className="py-2 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-xs font-semibold hover:opacity-85 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan Periode
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Back button */}
        <div className="flex justify-center pt-8">
          <Link
            href="/payroll"
            className="inline-flex items-center gap-1.5 py-2.5 px-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-sm select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Menu Payroll
          </Link>
        </div>
      </main>
    </div>
  );
}
